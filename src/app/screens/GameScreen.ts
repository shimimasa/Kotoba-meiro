import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

export function GameScreen(router: Router): HTMLElement {
  // ===== root =====
  const wrap = document.createElement("div");

wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto auto 1fr auto";
  (wrap.style as any).height = "100dvh"; // iOS対策
  wrap.style.overflow = "hidden";
  wrap.style.background = "white";
  wrap.style.fontFamily = "system-ui, sans-serif";
  // ===== top bar =====
  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";
  top.style.padding = "10px 12px";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "10px 14px";
  backBtn.style.borderRadius = "999px";
  backBtn.style.border = "1px solid #ddd";
  backBtn.style.background = "#fff";
  backBtn.addEventListener("click", () => router.go("start"));

  const hintLabel = document.createElement("div");
  hintLabel.style.opacity = "0.85";
  hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

  top.append(backBtn, hintLabel);
  wrap.appendChild(top);

  // ===== HUD =====
  const hud = document.createElement("div");
  hud.style.display = "flex";
  hud.style.alignItems = "flex-start";
  hud.style.justifyContent = "space-between";
  hud.style.padding = "10px 16px";
  hud.style.gap = "16px";

  const leftHud = document.createElement("div");
  leftHud.style.display = "flex";
  leftHud.style.flexDirection = "column";
  leftHud.style.gap = "6px";

  const nextEl = document.createElement("div");
  nextEl.textContent = "つぎ：-";

  const dotsEl = document.createElement("div");
  dotsEl.textContent = "○○○○○";

  leftHud.append(nextEl, dotsEl);

  const rightHud = document.createElement("div");
  rightHud.style.textAlign = "right";
  rightHud.style.opacity = "0.9";

  const timeEl = document.createElement("div");
  timeEl.textContent = "⏱ 0:00";

  const scoreEl = document.createElement("div");
  scoreEl.textContent = "score: 0";

  rightHud.append(timeEl, scoreEl);

  hud.append(leftHud, rightHud);
  wrap.appendChild(hud);

  // ===== main (canvas) =====
  const main = document.createElement("div");

// ✅ 余った高さをmainが全部受け持つ（canvasはこの中に収まる）
main.style.flex = "1";
main.style.minHeight = "0";        // ← これが超重要（オーバーフロー防止）
main.style.position = "relative";
main.style.overflow = "hidden";

// 中央寄せ（好みでOK）
main.style.display = "flex";
main.style.alignItems = "center";
main.style.justifyContent = "center";

  main.style.padding = "8px 12px";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";   // ← mainがflex:1/minHeight:0ならOK
  canvas.style.display = "block";
  canvas.style.touchAction = "none"; // スクロール/拡大を抑制
  canvas.setAttribute("aria-label", "game canvas");

  main.appendChild(canvas);
  main.appendChild(main);
 
  // --- D-pad（スマホのみ表示）
  const dpad = document.createElement("div");
  dpad.style.display = "grid";
  dpad.style.gridTemplateColumns = "64px 64px 64px";
  dpad.style.gridTemplateRows = "64px 64px 64px";
  dpad.style.gap = "12px";
  dpad.style.justifyContent = "start";
  dpad.style.alignContent = "center";
  dpad.style.padding = "16px";
  dpad.style.userSelect = "none";

  const mkBtn = (label: string) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.width = "64px";
    b.style.height = "64px";
    b.style.borderRadius = "16px";
    b.style.border = "1px solid #ddd";
    b.style.background = "white";
    b.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    b.style.fontSize = "20px";
    b.style.cursor = "pointer";
    (b.style as any).webkitTapHighlightColor = "transparent";
    return b;
  };

  const up = mkBtn("▲");
  const left = mkBtn("◀");
  const right = mkBtn("▶");
  const down = mkBtn("▼");

  // 配置（十字）
  dpad.appendChild(document.createElement("div"));
  dpad.appendChild(up);
  dpad.appendChild(document.createElement("div"));
  dpad.appendChild(left);
  dpad.appendChild(document.createElement("div"));
  dpad.appendChild(right);
  dpad.appendChild(document.createElement("div"));
  dpad.appendChild(down);
  dpad.appendChild(document.createElement("div"));

  wrap.appendChild(dpad);

  const isTouch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  if (!isTouch) dpad.style.display = "none";
  // ===== engine start =====
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    onExit: () => router.go("start"),
    // もし onResult が必要ならここに追加（あなたの実装に合わせる）
    // onResult: (result) => { router.setResult(result); router.go("result"); },
    // level: router.getSettings().level ?? 1,
  } as any);

  const stop = startLoop(engine);

  // ===== HUD update loop =====
  const fmtTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  let raf = 0;
  const tickHud = () => {
    // getState が無い場合でも落とさない
    const st = (engine as any).getState?.() ?? (engine as any).state;
    const maze = st?.maze;

    const elapsed = maze?.elapsedSec ?? 0;
    timeEl.textContent = `⏱ ${fmtTime(elapsed)}`;

    const score = maze?.score ?? 0;
    scoreEl.textContent = `score: ${score}`;

    const total = maze?.letters?.length ?? 0;
    const idx = maze?.nextLetterIndex ?? 0;
    const next = maze?.letters?.[idx]?.letter ?? "-";
    nextEl.textContent = `つぎ：${next}`;

    const done = Math.max(0, Math.min(total, idx));
    dotsEl.textContent = `${"●".repeat(done)}${"○".repeat(Math.max(0, total - done))}`;

    raf = requestAnimationFrame(tickHud);
  };
  raf = requestAnimationFrame(tickHud);

  // ===== dispose =====
  wrap.addEventListener("remove", () => {
    if (raf) cancelAnimationFrame(raf);
    stop();
    (engine as any).dispose?.();
  });

  return wrap;
}
