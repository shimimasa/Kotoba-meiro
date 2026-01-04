// src/app/screens/GameScreen.ts
import type { Router } from "../router";
import type { GameResult } from "../../game/engine/engine";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  // D-pad をレイアウトから外して absolute で重ねるので、最下段(row)を廃止
  wrap.style.gridTemplateRows = "auto auto 1fr";
  wrap.style.width = "100%";
  wrap.style.background = "white";
  wrap.style.position = "relative";
  wrap.style.overflow = "hidden";
  // iOSで100vhが暴れるので dvh
  (wrap.style as any).height = "100dvh";

  // --- top bar
  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.justifyContent = "space-between";
  top.style.alignItems = "center";
  top.style.padding = "10px 14px";
  top.style.borderBottom = "1px solid #eee";
  top.style.background = "white";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "10px 14px";
  backBtn.style.borderRadius = "999px";
  backBtn.style.border = "1px solid #ddd";
  backBtn.style.background = "white";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => router.go("start");

  const hintLabel = document.createElement("div");
  hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;
  hintLabel.style.opacity = "0.85";

  top.append(backBtn, hintLabel);

  // --- HUD
  const hud = document.createElement("div");
  hud.style.display = "flex";
  hud.style.justifyContent = "space-between";
  hud.style.alignItems = "flex-start";
  hud.style.padding = "10px 14px";

  const leftHud = document.createElement("div");
  leftHud.style.display = "grid";
  leftHud.style.gap = "6px";

  const nextEl = document.createElement("div");
  nextEl.textContent = "つぎ: -";

  const dotsEl = document.createElement("div");
  dotsEl.textContent = "";

  const progressEl = document.createElement("div");
  progressEl.textContent = "progress: 0/0";

  leftHud.append(nextEl, dotsEl, progressEl);

  const rightHud = document.createElement("div");
  rightHud.style.textAlign = "right";
  rightHud.style.opacity = "0.9";

  const timeEl = document.createElement("div");
  timeEl.textContent = "⏱ 0:00";

  const scoreEl = document.createElement("div");
  scoreEl.textContent = "score: 0";

  rightHud.append(timeEl, scoreEl);
  hud.append(leftHud, rightHud);

  // --- main (canvas)
  const main = document.createElement("div");
  main.style.display = "grid";
  main.style.placeItems = "center";
  // main が 1fr の高さの中で正しく縮むために必須
  main.style.minHeight = "0";
  // 上下を少し詰めて 1画面内に収めやすくする
  main.style.padding = "6px";
  main.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  // 親(main)の中で「できるだけ大きく」正方形を維持する
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "100%";
  canvas.style.width = "min(100%, 720px)";
  canvas.style.height = "min(100%, 720px)";
  (canvas.style as any).aspectRatio = "1 / 1";
  canvas.style.display = "block";
  // 重要：iOSでスクロール/ズームに奪われない
  canvas.style.touchAction = "none";
  canvas.setAttribute("aria-label", "game canvas");
  main.append(canvas);

  // --- D-pad (mobile)
  const dpadWrap = document.createElement("div");
  dpadWrap.style.position = "relative";
  dpadWrap.style.display = "grid";
  dpadWrap.style.placeItems = "center";
  dpadWrap.style.padding = "12px 0 14px 0";

  const dpad = document.createElement("div");
  dpad.style.display = "grid";
  dpad.style.gridTemplateColumns = "64px 64px 64px";
  dpad.style.gridTemplateRows = "64px 64px 64px";
  dpad.style.gap = "10px";

  // レイアウトから外して、左下に固定表示
  dpadWrap.style.position = "absolute";
  dpadWrap.style.left = "12px";
  dpadWrap.style.bottom = "12px";
  dpadWrap.style.zIndex = "50";
  dpadWrap.style.padding = "10px";   
  dpadWrap.style.borderRadius = "14px";
  dpadWrap.style.background = "rgba(255,255,255,0.0)";

  // pointerがcoarse(=タッチ)の端末だけ表示（PCでは邪魔になりやすい）
  const isTouch = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  dpadWrap.style.display = isTouch ? "grid" : "none";

  const makeBtn = (label: string) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.width = "64px";
    b.style.height = "64px";
    b.style.borderRadius = "16px";
    b.style.border = "1px solid #ddd";
    b.style.background = "white";
    b.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
    b.style.fontSize = "20px";
    b.style.cursor = "pointer";
    b.style.touchAction = "manipulation"; // ダブルタップズーム抑止
    return b;
  };

  const up = makeBtn("▲");
  const left = makeBtn("◀");
  const right = makeBtn("▶");
  const down = makeBtn("▼");

  // 配置
  dpad.append(
    document.createElement("div"), up, document.createElement("div"),
    left, document.createElement("div"), right,
    document.createElement("div"), down, document.createElement("div"),
  );
  dpadWrap.append(dpad);

  // --- build DOM
  wrap.append(top, hud, main, dpadWrap);

  // ===== Engine start =====
  const { hintEnabled, level } = router.getSettings();

  const engine = createEngine({
    canvas,
    hintEnabled,
    level,
    onResult: (r: any) => {
      router.setResult(r);
      router.go("result");
    },
    onExit: () => router.go("start"),
  });

  const stopLoop = startLoop(engine);

  // HUD更新（getStateを使う）
  let raf = 0;
  const fmtTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const tickHud = () => {
    const st = engine.getState?.();
    const maze: any = (st as any)?.maze;

    const elapsed = maze?.elapsedSec ?? 0;
    timeEl.textContent = `⏱ ${fmtTime(elapsed)}`;

    const score = (st as any)?.score ?? 0;
    scoreEl.textContent = `score: ${score}`;

    const letters = maze?.letters ?? [];
    const idx = maze?.nextLetterIndex ?? 0;
    const total = letters.length || 0;
    const next = letters[idx]?.letter ?? "-";
    nextEl.textContent = `つぎ: ${next}`;

    const done = Math.max(0, Math.min(total, idx));
    dotsEl.textContent = `${"●".repeat(done)}${"○".repeat(Math.max(0, total - done))}`;

    const eaten = maze?.pelletsEaten ?? 0;
    const pelletsTotal = maze?.pelletsTotal ?? 0;
    progressEl.textContent = `progress: ${eaten}/${pelletsTotal}`;

    raf = requestAnimationFrame(tickHud);
  };
  raf = requestAnimationFrame(tickHud);

  // D-pad：1タップで1マス（連続移動が起きないよう “click” だけで送る）
  const send = (dir: "up" | "down" | "left" | "right") => {
    const input: any = (engine as any).input;
    if (input?.enqueue) input.enqueue(dir);
    else if (input?.setDirOnce) input.setDirOnce(dir);
    else if ((engine as any).setDirOnce) (engine as any).setDirOnce(dir);
  };

  up.addEventListener("click", (e) => { e.preventDefault(); send("up"); });
  down.addEventListener("click", (e) => { e.preventDefault(); send("down"); });
  left.addEventListener("click", (e) => { e.preventDefault(); send("left"); });
  right.addEventListener("click", (e) => { e.preventDefault(); send("right"); });

  // 画面が外れたら停止
  const mo = new MutationObserver(() => {
    if (!wrap.isConnected) {
      try { stopLoop?.(); } catch {}
      try { cancelAnimationFrame(raf); } catch {}
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return wrap;
}

