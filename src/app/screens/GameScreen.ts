import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";
import type { GameResult } from "../../game/engine/engine";

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto auto 1fr";
    // iOS対策: 100vhより100dvhが安定
    (wrap.style as any).height = "100dvh";
  wrap.style.fontFamily = "system-ui, sans-serif";
  wrap.style.background = "white";
  wrap.style.position = "relative"; // ←これ必須
  wrap.style.overflow = "hidden";
  wrap.style.height = "100dvh"; // 可能なら（対応してない環境でも崩れにくい）

  // --- top bar
  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";
  top.style.padding = "10px 12px";
  top.style.borderBottom = "1px solid rgba(0,0,0,0.1)";
  top.style.background = "white";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "8px 12px";
  backBtn.style.borderRadius = "10px";
  backBtn.style.border = "1px solid rgba(0,0,0,0.15)";
  backBtn.style.background = "white";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => router.go("start");

  const hintLabel = document.createElement("div");
  hintLabel.style.fontSize = "14px";
  hintLabel.style.opacity = "0.85";
  hintLabel.textContent = router.getSettings().hintEnabled ? "ヒント：ON" : "ヒント：OFF";

  top.append(backBtn, hintLabel);
   wrap.appendChild(top);
 
  // --- HUD（情報表示）
  const hud = document.createElement("div");
  hud.style.display = "grid";
  hud.style.gridTemplateColumns = "1fr auto";
  hud.style.rowGap = "6px";
  hud.style.columnGap = "12px";
  hud.style.padding = "10px 16px";
  hud.style.borderBottom = "1px solid #f0f0f0";
  hud.style.fontSize = "14px";
  hud.style.lineHeight = "1.2";

  const nextEl = document.createElement("div");
  nextEl.style.fontWeight = "600";
  nextEl.textContent = "つぎ：-";

  const timeEl = document.createElement("div");
  timeEl.style.opacity = "0.85";
  timeEl.style.textAlign = "right";
  timeEl.textContent = "⏱ 0:00";

  const dotsEl = document.createElement("div");
  dotsEl.style.opacity = "0.9";
  dotsEl.textContent = "●●●●●";

  const scoreEl = document.createElement("div");
  scoreEl.style.opacity = "0.85";
  scoreEl.style.textAlign = "right";
  scoreEl.textContent = "score: 0";

  hud.append(nextEl, timeEl, dotsEl, scoreEl);
  wrap.appendChild(hud);

  // --- main (canvas container)
  const main = document.createElement("div");
   main.style.position = "relative";
   main.style.overflow = "hidden";
   main.style.display = "grid";
   main.style.placeItems = "center";
  // 下にD-padが来る前提で余白を確保（スマホの安全域に強い）
  main.style.paddingBottom = "140px";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none"; // 重要
  canvas.setAttribute("aria-label", "game canvas");
  main.appendChild(canvas);

  // ===== Mobile D-pad (fixed + safe-area + tap=1step, hold=repeat) =====

// engine が window でも canvas でも keydown を受け取れるように両方へ投げる
const fireKey = (key: string) => {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  window.dispatchEvent(ev);
  canvas.dispatchEvent(ev);
};

// 長押しのときだけ連打する（短押しは1回だけ）
const startHoldRepeat = (key: string) => {
  fireKey(key); // 短押し分の1回

  // ここから「長押しなら連打開始」
  let intervalId: number | null = null;
  const timeoutId = window.setTimeout(() => {
    intervalId = window.setInterval(() => fireKey(key), 90);
  }, 250);

  // stop
  return () => {
    window.clearTimeout(timeoutId);
    if (intervalId !== null) window.clearInterval(intervalId);
  };
};

const createDpad = () => {
  const pad = document.createElement("div");
  pad.setAttribute("aria-label", "D-pad");

  // ★重要：fixed + safe-area
  pad.style.position = "fixed";
  pad.style.left = "calc(12px + env(safe-area-inset-left))";
  pad.style.bottom = "calc(12px + env(safe-area-inset-bottom))";

  pad.style.width = "160px";
  pad.style.height = "160px";
  pad.style.display = "grid";
  pad.style.gridTemplateColumns = "1fr 1fr 1fr";
  pad.style.gridTemplateRows = "1fr 1fr 1fr";
  pad.style.gap = "10px";
  pad.style.pointerEvents = "auto";
  pad.style.userSelect = "none";
  pad.style.touchAction = "none";
  pad.style.zIndex = "1000"; // canvasより前に

  const mkBtn = (label: string, key: string, col: number, row: number) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;

    b.style.gridColumn = String(col);
    b.style.gridRow = String(row);

    b.style.borderRadius = "14px";
    b.style.border = "1px solid rgba(0,0,0,0.18)";
    b.style.background = "rgba(255,255,255,0.92)";
    b.style.backdropFilter = "blur(6px)";
    b.style.fontSize = "22px";
    b.style.fontWeight = "800";
    b.style.cursor = "pointer";
    b.style.width = "100%";
    b.style.height = "100%";
    b.style.boxShadow = "0 6px 18px rgba(0,0,0,0.10)";
    b.style.touchAction = "none";

    let stop: null | (() => void) = null;

    const down = (ev: PointerEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      try {
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
      } catch {}

      if (stop) return;
      stop = startHoldRepeat(key); // ★短押し1回 + 長押し連打
      b.style.transform = "scale(0.98)";
    };

    const up = (ev?: PointerEvent) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      if (stop) stop();
      stop = null;
      b.style.transform = "";
    };

    b.addEventListener("pointerdown", down);
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("lostpointercapture", up);

    return b;
  };

  pad.append(
    mkBtn("▲", "ArrowUp", 2, 1),
    mkBtn("◀", "ArrowLeft", 1, 2),
    mkBtn("▶", "ArrowRight", 3, 2),
    mkBtn("▼", "ArrowDown", 2, 3)
  );

  return pad;
};

// ★fixedなので main ではなく document.body に載せるのが安定
const dpad = createDpad();
document.body.appendChild(dpad);

// 画面を離れるときに消す（MutationObserverの停止と同じタイミングでOK）
const cleanupDpad = () => {
  if (dpad.isConnected) dpad.remove();
};

  // engine
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    level: router.getSettings().level ?? 1,
    onResult: (result) => {
      router.setResult(result);
      router.go("result");
    },
    onExit: () => router.go("start"),
  });

  const stop = startLoop(engine);

  // --- HUD 更新（engineのstateを参照）
  let raf = 0;
  const fmtTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };
  const updateHud = () => {
        const maze = (engine.getState() as any).maze as any | undefined;
        const elapsed = maze?.elapsedSec ?? 0;
    timeEl.textContent = `⏱ ${fmtTime(elapsed)}`;

    if (maze?.letters?.length) {
            const total = maze.letters.length;
            const idx = maze.nextLetterIndex ?? 0;
            const next = maze.letters[idx]?.letter ?? "-";
      nextEl.textContent = `つぎ：${next}`;

      // 進捗ドット：済=● / 未=○
      const done = Math.max(0, Math.min(total, idx));
      dotsEl.textContent = `${"●".repeat(done)}${"○".repeat(total - done)}`;
    } else {
      nextEl.textContent = "つぎ：-";
      dotsEl.textContent = "";
    }

    // （必要なら）スコア表示もここで統一
    // scoreEl.textContent = `score:${maze?.score ?? 0}`;
    scoreEl.textContent = `score: ${maze?.score ?? 0}`;
    raf = requestAnimationFrame(updateHud);
  };
  raf = requestAnimationFrame(updateHud);

  // DOMから外れたら止める
  const mo = new MutationObserver(() => {
    if (!wrap.isConnected) {
      try { stop(); } catch {}
      try { cancelAnimationFrame(raf); } catch {}
      try { engine.dispose(); } catch {}
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
  return wrap;
}
