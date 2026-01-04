import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";

/**
 * GameScreen
 * - HUD は上1本に統一
 * - canvas は中央固定 + 「高さ基準」でスケール（max-height 優先）
 * - D-pad はスマホ（pointer:coarse）時のみ左下 fixed
 * - PC向け操作ヒント「←↑→↓でうごかす」を右上に表示
 */
export function GameScreen(router: Router): HTMLElement {
  // --- styles (screen-scoped) ---
  injectStyleOnce(
    "screen-game-style",
    `
    :root { --hud-h: 56px; }

    .gameRoot{
      height: 100dvh;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: #0b0b0b; /* 余白も黒に寄せる */
      color: #111;
      overflow: hidden;
    }

    .hud{
      height: var(--hud-h);
      flex: 0 0 var(--hud-h);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: #efefef;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      color: #111;
      box-sizing: border-box;
    }

    .hudLeft{
      display:flex;
      align-items:center;
      gap:10px;
      min-width: 180px;
    }
    .hudCenter{
      flex: 1;
      display:flex;
      justify-content:center;
      align-items:center;
      gap: 10px;
      font-size: 14px;
      white-space: nowrap;
      color:#222;
      opacity: .95;
    }
    .hudRight{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      gap: 14px;
      min-width: 240px;
      white-space: nowrap;
    }

    .btn{
      appearance: none;
      border: 1px solid rgba(0,0,0,0.15);
      background: #fff;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
    }
    .btn:active{ transform: translateY(1px); }

    .hintText{
      font-size: 13px;
      color: #111;
    }
    .kbdHint{
      font-size: 12px;
      color: #333;
      opacity: .8;
    }

    .stageWrap{
      flex: 1;
      display:flex;
      align-items:center;
      justify-content:center;
      padding: 12px;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* canvas を「高さ基準」で最大化（横は自動） */
    .canvasHost{
      height: calc(100dvh - var(--hud-h) - 24px);
      width: min(100%, 1100px);
      display:flex;
      align-items:center;
      justify-content:center;
      overflow: hidden;
    }
    canvas.gameCanvas{
      height: 100%;
      width: auto;
      max-width: 100%;
      display:block;
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      background: #111; /* 未描画時も黒 */
      touch-action: none;
    }

    /* D-pad (mobile only) */
    .dpad{
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 50;
      display:none;
      user-select:none;
      -webkit-user-select:none;
      touch-action: none;
      pointer-events:auto;
      gap: 10px;
      align-items:center;
      justify-content:center;
    }
    .dpadGrid{
      display:grid;
      grid-template-columns: 64px 64px 64px;
      grid-template-rows: 64px 64px 64px;
      gap: 10px;
    }
    .dpadBtn{
      width: 64px;
      height: 64px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.92);
      color:#111;
      font-size: 18px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow: 0 8px 18px rgba(0,0,0,0.22);
      cursor:pointer;
      touch-action:none;
    }
    .dpadBtn:active{ transform: translateY(1px); }

    /* pointer: coarse (スマホ/タブレット) で表示 */
    @media (pointer: coarse) {
      .dpad { display:flex; }
    }
  `
  );

  const root = document.createElement("div");
  root.className = "gameRoot";

  // --- HUD (single) ---
  const hud = document.createElement("div");
  hud.className = "hud";

  const left = document.createElement("div");
  left.className = "hudLeft";

  const backBtn = document.createElement("button");
  backBtn.className = "btn";
  backBtn.textContent = "← もどる";
  backBtn.addEventListener("click", () => router.go("start"));
  left.appendChild(backBtn);

  const center = document.createElement("div");
  center.className = "hudCenter";
  center.textContent = ""; // 後で更新

  const right = document.createElement("div");
  right.className = "hudRight";

  const hintLabel = document.createElement("div");
  hintLabel.className = "hintText";
  hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

  const kbdHint = document.createElement("div");
  kbdHint.className = "kbdHint";
  kbdHint.textContent = "←↑→↓でうごかす";

  right.appendChild(hintLabel);
  right.appendChild(kbdHint);

  hud.appendChild(left);
  hud.appendChild(center);
  hud.appendChild(right);

  // --- Stage / Canvas ---
  const stageWrap = document.createElement("div");
  stageWrap.className = "stageWrap";

  const canvasHost = document.createElement("div");
  canvasHost.className = "canvasHost";

  const canvas = document.createElement("canvas");
  canvas.className = "gameCanvas";
  canvas.setAttribute("aria-label", "game canvas");
  canvasHost.appendChild(canvas);
  stageWrap.appendChild(canvasHost);

  // --- D-pad (mobile only) ---
  const dpad = buildDpad();
  root.appendChild(hud);
  root.appendChild(stageWrap);
  root.appendChild(dpad);

  // --- Engine ---
  const settings = router.getSettings();
  const engine = createEngine({
    canvas,
    hintEnabled: settings.hintEnabled,
    level: settings.level ?? 1,
    onExit: () => router.go("start"),
  });

  // クリック/タップでフォーカス（キー操作を確実に）
  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", () => canvas.focus());

  // --- loop ---
  let rafId = 0;
  let last = performance.now();

  const tick = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    try {
      engine.update(dt);
      engine.render();
    } catch (e) {
      // ここで落ちると真っ暗になりがち。停止してコンソールに出す。
      console.error(e);
      stopLoop();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };
  const stopLoop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  // HUD更新（engine に getState がある場合は活用、無いなら表示だけ維持）
  const hudTimer = window.setInterval(() => {
    const st = (engine as any).getState?.();
    // st が取れない場合でも「ヒントON/OFF」だけは反映
    hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

    if (!st) {
      // fallback: HUDの最低限
      center.textContent = "";
      return;
    }

    // 「あと◯こ」= 残りの次文字（letters.length - nextLetterIndex）
    const total = Array.isArray(st.letters) ? st.letters.length : 0;
    const idx = typeof st.nextLetterIndex === "number" ? st.nextLetterIndex : 0;
    const remain = Math.max(0, total - idx);

    const score = typeof st.score === "number" ? st.score : 0;
    const time = typeof st.elapsedSec === "number" ? st.elapsedSec : 0;

    const mm = Math.floor(time / 60);
    const ss = Math.floor(time % 60);
    const timeStr = `${mm}:${String(ss).padStart(2, "0")}`;

    // HUD 1本に整理（中央）
    center.textContent = `あと${remain}　score:${score}　time:${timeStr}`;
  }, 120);

  // 画面破棄
  const cleanup = () => {
    stopLoop();
    clearInterval(hudTimer);
    try {
      engine.dispose();
    } catch {
      // ignore
    }
    detachDpad(dpad);
  };

  // router 側で unmount される想定。念のため外部から呼べるように
  (root as any).__cleanup = cleanup;

  // D-pad を engine の keydown に接続（window keydown 前提）
  attachDpad(dpad);

  // start
  startLoop();

  return root;
}

/* ---------------- helpers ---------------- */

function injectStyleOnce(id: string, cssText: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = cssText;
  document.head.appendChild(style);
}

function buildDpad(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "dpad";

  const grid = document.createElement("div");
  grid.className = "dpadGrid";

  const empty1 = document.createElement("div");
  const up = makeDpadBtn("▲", "ArrowUp");
  const empty2 = document.createElement("div");

  const left = makeDpadBtn("◀", "ArrowLeft");
  const empty3 = document.createElement("div");
  const right = makeDpadBtn("▶", "ArrowRight");

  const empty4 = document.createElement("div");
  const down = makeDpadBtn("▼", "ArrowDown");
  const empty5 = document.createElement("div");

  grid.appendChild(empty1);
  grid.appendChild(up);
  grid.appendChild(empty2);

  grid.appendChild(left);
  grid.appendChild(empty3);
  grid.appendChild(right);

  grid.appendChild(empty4);
  grid.appendChild(down);
  grid.appendChild(empty5);

  wrap.appendChild(grid);
  return wrap;
}

function makeDpadBtn(label: string, key: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "dpadBtn";
  btn.type = "button";
  btn.textContent = label;
  (btn as any).__key = key;
  return btn;
}

function dispatchArrowKey(key: string) {
  // engine が window.keydown を見ている前提
  const ev = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
  });
  window.dispatchEvent(ev);
}

function attachDpad(dpadRoot: HTMLElement) {
  const buttons = Array.from(dpadRoot.querySelectorAll("button")) as HTMLButtonElement[];
  const handlers: Array<() => void> = [];

  // 連打しやすいように hold-repeat
  for (const btn of buttons) {
    const key = (btn as any).__key as string | undefined;
    if (!key) continue;

    let holdTimer: number | null = null;

    const onDown = (e: Event) => {
      e.preventDefault();
      dispatchArrowKey(key);
      if (holdTimer != null) window.clearInterval(holdTimer);
      holdTimer = window.setInterval(() => dispatchArrowKey(key), 80);
    };

    const onUp = (e: Event) => {
      e.preventDefault();
      if (holdTimer != null) window.clearInterval(holdTimer);
      holdTimer = null;
    };

    btn.addEventListener("pointerdown", onDown, { passive: false });
    btn.addEventListener("pointerup", onUp, { passive: false });
    btn.addEventListener("pointercancel", onUp, { passive: false });
    btn.addEventListener("pointerleave", onUp, { passive: false });

    handlers.push(() => {
      btn.removeEventListener("pointerdown", onDown as any);
      btn.removeEventListener("pointerup", onUp as any);
      btn.removeEventListener("pointercancel", onUp as any);
      btn.removeEventListener("pointerleave", onUp as any);
      if (holdTimer != null) window.clearInterval(holdTimer);
    });
  }

  (dpadRoot as any).__detach = () => handlers.forEach((h) => h());
}

function detachDpad(dpadRoot: HTMLElement) {
  (dpadRoot as any).__detach?.();
}

