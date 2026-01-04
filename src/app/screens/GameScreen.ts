
import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

function isMobileLike() {
  const mq = window.matchMedia?.("(pointer: coarse)");
  return (mq && mq.matches) || window.innerWidth < 900;
}

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.height = "100vh";
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.boxSizing = "border-box";
  wrap.style.background = "#fff";
  wrap.style.fontFamily =
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  wrap.style.overflow = "hidden";

  // ===== HUD (1本に統一) =====
  const hud = document.createElement("div");
  hud.style.display = "flex";
  hud.style.alignItems = "center";
  hud.style.justifyContent = "space-between";
  hud.style.gap = "12px";
  hud.style.padding = "12px 16px";
  hud.style.borderBottom = "1px solid #eee";
  hud.style.boxSizing = "border-box";

  const hudLeft = document.createElement("div");
  hudLeft.style.display = "flex";
  hudLeft.style.alignItems = "center";
  hudLeft.style.gap = "12px";
  hudLeft.style.minWidth = "240px";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "10px 14px";
  backBtn.style.borderRadius = "999px";
  backBtn.style.border = "1px solid #ddd";
  backBtn.style.background = "#fff";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => router.go("start");

  const nextBox = document.createElement("div");
  nextBox.style.display = "flex";
  nextBox.style.flexDirection = "column";
  nextBox.style.gap = "4px";

  const nextLine = document.createElement("div");
  nextLine.style.fontSize = "16px";
  nextLine.style.fontWeight = "700";
  nextLine.textContent = "つぎ：-";

  const livesLine = document.createElement("div");
  livesLine.style.fontSize = "14px";
  livesLine.style.opacity = "0.9";
  livesLine.textContent = "○○○○○";

  nextBox.append(nextLine, livesLine);
  hudLeft.append(backBtn, nextBox);

  const hudCenter = document.createElement("div");
  hudCenter.style.flex = "1";
  hudCenter.style.textAlign = "center";
  hudCenter.style.fontSize = "14px";
  hudCenter.style.opacity = "0.9";
  hudCenter.textContent = "progress: 0/0  score:0";

  const hudRight = document.createElement("div");
  hudRight.style.minWidth = "200px";
  hudRight.style.textAlign = "right";
  hudRight.style.lineHeight = "1.6";

  const hintLine = document.createElement("div");
  hintLine.textContent = `ヒント：${
    router.getSettings().hintEnabled ? "ON" : "OFF"
  }`;

  const timeLine = document.createElement("div");
  timeLine.textContent = "⏱ 0:00";

  const scoreLine = document.createElement("div");
  scoreLine.textContent = "score: 0";

  hudRight.append(hintLine, timeLine, scoreLine);

  hud.append(hudLeft, hudCenter, hudRight);
  wrap.appendChild(hud);

  // ===== Main (canvas 中央固定 + 高さ基準スケール) =====
  const main = document.createElement("div");
  main.style.flex = "1";
  main.style.display = "flex";
  main.style.alignItems = "center";
  main.style.justifyContent = "center";
  main.style.padding = "12px";
  main.style.boxSizing = "border-box";
  main.style.position = "relative";
  wrap.appendChild(main);

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.maxHeight = "calc(100vh - 84px - 24px)";
  canvas.style.height = "100%";
  canvas.style.width = "auto";
  canvas.style.maxWidth = "min(96vw, 1000px)";
  canvas.style.background = "#111";
  canvas.style.borderRadius = "8px";
  main.appendChild(canvas);

  // ===== Engine =====
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    level: router.getSettings().level,
    onExit: () => router.go("start"),
  });

  const stop = startLoop(engine);

  // ===== D-pad (スマホ時のみ左下固定) =====
  const dpadWrap = document.createElement("div");
  dpadWrap.style.position = "fixed";
  dpadWrap.style.left = "16px";
  dpadWrap.style.bottom = "16px";
  dpadWrap.style.zIndex = "9999";
  dpadWrap.style.userSelect = "none";
  dpadWrap.style.webkitUserSelect = "none";
  dpadWrap.style.touchAction = "none";

  const dpadGrid = document.createElement("div");
  dpadGrid.style.display = "grid";
  dpadGrid.style.gridTemplateColumns = "64px 64px 64px";
  dpadGrid.style.gridTemplateRows = "64px 64px 64px";
  dpadGrid.style.gap = "12px";
  dpadWrap.appendChild(dpadGrid);

  const dispatchKey = (type: "keydown" | "keyup", key: string) => {
    const ev = new KeyboardEvent(type, {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(ev);
  };

  const mkBtn = (label: string, key: string) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.width = "64px";
    btn.style.height = "64px";
    btn.style.borderRadius = "14px";
    btn.style.border = "1px solid rgba(0,0,0,0.15)";
    btn.style.background = "rgba(255,255,255,0.9)";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
    btn.style.fontSize = "22px";
    btn.style.cursor = "pointer";
    btn.style.touchAction = "none";

    const down = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      dispatchKey("keydown", key);
    };
    const up = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      dispatchKey("keyup", key);
    };

    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("pointerleave", up);
    return btn;
  };

  dpadGrid.append(
    document.createElement("div"),
    mkBtn("▲", "ArrowUp"),
    document.createElement("div"),
    mkBtn("◀", "ArrowLeft"),
    document.createElement("div"),
    mkBtn("▶", "ArrowRight"),
    document.createElement("div"),
    mkBtn("▼", "ArrowDown"),
    document.createElement("div")
  );

  document.body.appendChild(dpadWrap);

  const syncDpadVisible = () => {
    dpadWrap.style.display = isMobileLike() ? "block" : "none";
  };
  syncDpadVisible();
  window.addEventListener("resize", syncDpadVisible);

  // ===== HUD update（maze から next を取る）=====
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const hudTimer = window.setInterval(() => {
    const st = engine.getState?.();
    if (!st) return;

    const m = (st as any).maze;
    const hintEnabled =
      (st as any).hintEnabled ?? router.getSettings().hintEnabled;

    let nextLetter = "-";
    if (hintEnabled && m?.letters && typeof m.nextLetterIndex === "number") {
      nextLetter = m.letters[m.nextLetterIndex]?.letter ?? "-";
    }

    const total = m?.letters?.length ?? 0;
    const collected = m?.nextLetterIndex ?? 0;
    const lives = (st as any).lives ?? (st as any).life ?? 0;
    const score = (st as any).score ?? 0 as number;
    const elapsed = (st as any).timeSec ?? (st as any).elapsedSec ?? 0;

    nextLine.textContent = `つぎ：${nextLetter}`;
    livesLine.textContent =
      "●".repeat(Math.max(0, lives)) +
      "○".repeat(Math.max(0, 5 - lives));

    hudCenter.textContent = `progress: ${collected}/${total}  score:${score}`;
    hintLine.textContent = `ヒント：${hintEnabled ? "ON" : "OFF"}`;
    timeLine.textContent = `⏱ ${fmtTime(elapsed)}`;
    scoreLine.textContent = `score: ${score}`;
  }, 200);

  // cleanup
  const cleanup = () => {
    window.clearInterval(hudTimer);
    window.removeEventListener("resize", syncDpadVisible);
    dpadWrap.remove();
    stop();
  };

  (wrap as any).__cleanup = cleanup;
  return wrap;
}