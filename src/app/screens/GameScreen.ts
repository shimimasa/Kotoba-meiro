import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";
import type { GameResult } from "../../game/engine/engine"; // パスはプロジェクトに合わせて調整
export function GameScreen(router: Router): HTMLElement {
  // ===== Root =====
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  // iOS/Safari 対策：100vh より 100dvh の方が「見えてる領域」に合いやすい
  (wrap.style as any).height = "100dvh";
  wrap.style.overflow = "hidden";
  wrap.style.background = "white";
  wrap.style.fontFamily = "system-ui, sans-serif";

  // 画面離脱時のクリーンアップ用
  const ac = new AbortController();
  const { signal } = ac;

  // ===== Top bar =====
  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";
  top.style.padding = "10px 12px";
  top.style.borderBottom = "1px solid rgba(0,0,0,0.08)";
  top.style.background = "white";

  const back = document.createElement("button");
  back.type = "button";
  back.textContent = "← もどる";
  back.style.padding = "10px 14px";
  back.style.borderRadius = "999px";
  back.style.border = "1px solid rgba(0,0,0,0.15)";
  back.style.background = "white";
  back.style.cursor = "pointer";
  back.addEventListener(
    "click",
    () => router.go("start"),
    { signal },
  );

  const hint = document.createElement("div");
  hint.style.fontSize = "16px";
  hint.style.opacity = "0.9";
  hint.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

  top.append(back, hint);

  // ===== HUD (任意：スクショにある表示っぽく) =====
  const hud = document.createElement("div");
  hud.style.display = "flex";
  hud.style.justifyContent = "space-between";
  hud.style.alignItems = "flex-start";
  hud.style.padding = "10px 12px";
  hud.style.gap = "12px";
  hud.style.background = "white";

  const hudLeft = document.createElement("div");
  hudLeft.style.minWidth = "220px";
  hudLeft.style.lineHeight = "1.6";

  const hudCenter = document.createElement("div");
  hudCenter.style.flex = "1";
  hudCenter.style.textAlign = "center";
  hudCenter.style.paddingTop = "6px";
  hudCenter.style.opacity = "0.9";

  const hudRight = document.createElement("div");
  hudRight.style.minWidth = "160px";
  hudRight.style.textAlign = "right";
  hudRight.style.lineHeight = "1.6";

  hud.append(hudLeft, hudCenter, hudRight);

  // ===== Main (canvas centered) =====
  const main = document.createElement("div");
  main.style.flex = "1";
  main.style.minHeight = "0"; // これが無いと子要素がはみ出して画面下が切れやすい
  main.style.position = "relative";
  main.style.display = "flex";
  main.style.alignItems = "center";
  main.style.justifyContent = "center";
  main.style.overflow = "hidden";
  main.style.padding = "12px";

  // キャンバスは「見える領域に収める」：中央固定・最大幅を制限
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.maxWidth = "min(960px, 100%)";
  canvas.style.maxHeight = "100%";
  canvas.style.touchAction = "none"; // スワイプスクロールを抑制
  main.appendChild(canvas);

  // ===== D-pad (fixed bottom-left, clickable) =====
  const dpadWrap = document.createElement("div");
  dpadWrap.style.position = "fixed";
  dpadWrap.style.left = "16px";
  dpadWrap.style.bottom = "16px";
  dpadWrap.style.zIndex = "1000";
  dpadWrap.style.userSelect = "none";
  (dpadWrap.style as any).touchAction = "none";
  dpadWrap.style.pointerEvents = "auto";

  const dpadGrid = document.createElement("div");
  dpadGrid.style.display = "grid";
  dpadGrid.style.gridTemplateColumns = "68px 68px 68px";
  dpadGrid.style.gridTemplateRows = "68px 68px 68px";
  dpadGrid.style.gap = "12px";
  dpadWrap.appendChild(dpadGrid);

  const dispatchKey = (type: "keydown" | "keyup", key: string) => {
    const ev = new KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
    });
    // エンジンが window / document のどちらで監視していても届くよう両方投げる
    window.dispatchEvent(ev);
    document.dispatchEvent(ev);
  };

  const bindHold = (btn: HTMLButtonElement, key: string) => {
    let pressed = false;
    let timer: number | null = null;

    const down = (e: Event) => {
      e.preventDefault();
      if (pressed) return;
      pressed = true;
      dispatchKey("keydown", key);
      // 押しっぱなしで移動させたい場合：一定間隔で keydown を投げる
      timer = window.setInterval(() => dispatchKey("keydown", key), 80);
    };

    const up = (e?: Event) => {
      if (e) e.preventDefault();
      if (!pressed) return;
      pressed = false;
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
      dispatchKey("keyup", key);
    };

    btn.addEventListener("pointerdown", down, { signal });
    btn.addEventListener("pointerup", up, { signal });
    btn.addEventListener("pointercancel", up, { signal });
    btn.addEventListener("pointerleave", up, { signal });

    // 旧イベントも保険で
    btn.addEventListener("mousedown", down, { signal });
    btn.addEventListener("mouseup", up, { signal });
    btn.addEventListener("mouseleave", up, { signal });
    btn.addEventListener("touchstart", down, { passive: false, signal });
    btn.addEventListener("touchend", up, { passive: false, signal });
    btn.addEventListener("touchcancel", up, { passive: false, signal });
  };

  const mkBtn = (label: string) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.style.width = "68px";
    b.style.height = "68px";
    b.style.borderRadius = "16px";
    b.style.border = "1px solid rgba(0,0,0,0.12)";
    b.style.background = "white";
    b.style.fontSize = "22px";
    b.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)";
    b.style.cursor = "pointer";
    (b.style as any).touchAction = "none";
    return b;
  };

  const upBtn = mkBtn("▲");
  const leftBtn = mkBtn("◀");
  const rightBtn = mkBtn("▶");
  const downBtn = mkBtn("▼");

  // 配置
  dpadGrid.append(
    document.createElement("div"),
    upBtn,
    document.createElement("div"),
    leftBtn,
    document.createElement("div"),
    rightBtn,
    document.createElement("div"),
    downBtn,
    document.createElement("div"),
  );

  // 疑似キー入力でエンジンに届かせる
  bindHold(upBtn, "ArrowUp");
  bindHold(downBtn, "ArrowDown");
  bindHold(leftBtn, "ArrowLeft");
  bindHold(rightBtn, "ArrowRight");

  // ===== Assemble =====
  wrap.append(top, hud, main);
  wrap.appendChild(dpadWrap);

  // ===== Engine start =====
  const engine = createEngine({
        canvas,
        hintEnabled: router.getSettings().hintEnabled,
        level: router.getSettings().level ?? 1,
        onResult: (result: GameResult) => {
          router.setResult(result);
          router.go("result");
        },
        onExit: () => router.go("start"),
      });

  const stop = startLoop(engine);

  // HUD 更新（エンジンが getState を持つ前提。無ければ何も起きない）
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const hudTimer = window.setInterval(() => {
    const st = (engine as any).getState?.();
    if (!st) return;

    // ここはあなたの GameState の実際の構造に合わせて調整してOK
    const next = st.nextLabel ?? st.next ?? st.nextChar ?? "-";
    const lives = st.lives ?? st.life ?? 0;

    const pelletsEaten = st.pelletsEaten ?? st.progress ?? 0;
    const pelletsTotal = st.pelletsTotal ?? st.total ?? 0;

    const lettersCollected = st.lettersCollected ?? 0;
    const lettersTotal = st.lettersTotal ?? 0;

    const elapsedSec = st.elapsedSec ?? st.time ?? 0;
    const score = st.score ?? 0;

    hudLeft.innerHTML = `
      <div style="font-size:18px;font-weight:600;">つぎ：${next}</div>
      <div style="margin-top:6px;">${"●".repeat(Math.max(0, lives))}${"○".repeat(Math.max(0, 5 - lives))}</div>
      <div style="margin-top:6px;">progress: ${pelletsEaten}/${pelletsTotal}</div>
    `.trim();

    hudCenter.textContent = `progress: ${lettersCollected}/${lettersTotal}  score:${score}  hint:${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

    hudRight.innerHTML = `
      <div style="font-size:16px;opacity:.9;">ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}</div>
      <div style="margin-top:6px;">⏱ ${fmtTime(elapsedSec)}</div>
      <div>score: ${score}</div>
    `.trim();
  }, 100);

  // ===== Cleanup =====
  const cleanup = () => {
    window.clearInterval(hudTimer);
    stop();
    ac.abort();
  };

  // remove イベントはブラウザ標準ではないので、確実な経路として Abort + stop を併用
  wrap.addEventListener("DOMNodeRemoved", cleanup, { signal });

  // ルーターが画面切替時に要素を捨てるなら、GCで拾われるが、
  // 念のため外部から呼べないので「戻る」でも停止させる
  back.addEventListener("click", cleanup, { signal });

  return wrap;
}


