
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
   wrap.style.position = "relative";
   wrap.style.overflow = "hidden";

   // --- top bar controls
  const backBtn: HTMLButtonElement = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "10px 16px";
  backBtn.style.border = "1px solid rgba(0,0,0,0.15)";
  backBtn.style.borderRadius = "14px";
  backBtn.style.background = "white";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => router.go("start");

  const hintLabel: HTMLDivElement = document.createElement("div");
  hintLabel.style.opacity = "0.85";
  hintLabel.style.whiteSpace = "nowrap";
  hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

 
   // --- top bar
   const top = document.createElement("div");
   top.style.display = "flex";
   top.style.alignItems = "center";
   top.style.justifyContent = "space-between";
   top.style.padding = "10px 16px";
 
   top.append(backBtn, hintLabel);
   wrap.appendChild(top);
 
   // --- HUD（情報表示）
   const hud = document.createElement("div");

  hud.style.display = "flex";
  hud.style.justifyContent = "space-between";
  hud.style.alignItems = "flex-start";
  hud.style.padding = "10px 16px";
  hud.style.gap = "12px";

  // left area
  const leftHud = document.createElement("div");
  leftHud.style.display = "grid";
  leftHud.style.gap = "4px";
  const nextEl = document.createElement("div");
  nextEl.style.fontSize = "16px";
  nextEl.textContent = "つぎ：-";

  const dotsEl = document.createElement("div");
  dotsEl.style.fontSize = "16px";
  dotsEl.style.letterSpacing = "2px";
  dotsEl.textContent = "○○○○○";
  leftHud.append(nextEl, dotsEl);

  // right area
  const rightHud = document.createElement("div");
  rightHud.style.display = "grid";
  rightHud.style.gap = "6px";
  rightHud.style.textAlign = "right";

  const timeEl = document.createElement("div");
  timeEl.style.opacity = "0.85";
  timeEl.textContent = "⏱ 0:00";

  const scoreEl = document.createElement("div");
  scoreEl.style.opacity = "0.85";
  scoreEl.textContent = "score: 0";

  rightHud.append(timeEl, scoreEl);
  hud.append(leftHud, rightHud);
   wrap.appendChild(hud);
 
  // --- main（canvasを載せる）
  const main = document.createElement("div");
  main.style.position = "relative";
  main.style.overflow = "hidden";
  main.style.display = "grid";
  main.style.placeItems = "center";
  main.style.padding = "8px 16px 140px"; // 下にD-padが来ても被りにくい
  wrap.appendChild(main);

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none"; // 重要（スワイプ/ダブルタップ等でズレない）
  canvas.setAttribute("aria-label", "game canvas");
  main.appendChild(canvas);
 
   // --- engine 起動
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

  // --- HUD 更新（engine.getState を参照）
   let raf = 0;
   const fmtTime = (sec: number) => {
     const s = Math.max(0, Math.floor(sec));
     const m = Math.floor(s / 60);
     const r = s % 60;
     return `${m}:${String(r).padStart(2, "0")}`;
   };
 
   const updateHud = () => {
    const st: any = (engine as any).getState ? (engine as any).getState() : undefined;
    const maze = st?.maze;

    const elapsed = st?.elapsedSec ?? 0;
    timeEl.textContent = `⏱ ${fmtTime(elapsed)}`;
    scoreEl.textContent = `score: ${st?.score ?? 0}`;

    if (maze?.letters?.length) {
      const total = maze.letters.length;
      const idx = maze.nextLetterIndex ?? 0;
      const next = maze.letters[idx]?.letter ?? "-";
      nextEl.textContent = `つぎ：${next}`;

      const done = Math.max(0, Math.min(total, idx));
      dotsEl.textContent = `${"●".repeat(done)}${"○".repeat(total - done)}`;
     } else {
       nextEl.textContent = "つぎ：-";
       dotsEl.textContent = "○○○○○";
     }
 
     raf = requestAnimationFrame(updateHud);
   };
   raf = requestAnimationFrame(updateHud);
 
  // --- D-pad（タッチ端末のみ）
  const isTouch = matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window;

  if (isTouch) {
    const dpad = createDpad((dir) => {
      // キーボード入力に寄せる（既存の入力処理を流用）
      const map: Record<typeof dir, string> = {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      };
      const key = map[dir];
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key }));
    });
    wrap.appendChild(dpad);
  }

   // --- 破棄
   const mo = new MutationObserver(() => {
     if (!wrap.isConnected) {
       stop();
       cancelAnimationFrame(raf);
       mo.disconnect();
     }
   });
   mo.observe(document.body, { childList: true, subtree: true });
 
   return wrap;
 }
 
 function createDpad(onDir: (dir: "up" | "down" | "left" | "right") => void): HTMLDivElement {
   const dpad = document.createElement("div");
   dpad.style.position = "absolute";
   dpad.style.left = "16px";
   dpad.style.bottom = "16px";
   dpad.style.display = "grid";
   dpad.style.gridTemplateColumns = "64px 64px 64px";
   dpad.style.gridTemplateRows = "64px 64px 64px";
   dpad.style.gap = "10px";
   dpad.style.zIndex = "10";
   dpad.style.userSelect = "none";
 
  // 連打で複数マス動くのを抑える（軽いクールダウン）
  let last = 0;
  const fire = (dir: "up" | "down" | "left" | "right") => {
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    onDir(dir);
  };

   const mkBtn = (label: string, dir: "up" | "down" | "left" | "right") => {
     const b = document.createElement("button");
     b.type = "button";
     b.textContent = label;
     b.style.width = "64px";
     b.style.height = "64px";
     b.style.borderRadius = "14px";
     b.style.border = "1px solid rgba(0,0,0,0.12)";
     b.style.background = "rgba(255,255,255,0.95)";
     b.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
     b.style.fontSize = "22px";
     b.style.cursor = "pointer";
     b.style.touchAction = "manipulation";
 

    const onPress = (e: Event) => {
       e.preventDefault();
       fire(dir);
     };
 
     b.addEventListener("pointerdown", onPress, { passive: false });
     b.addEventListener("click", onPress, { passive: false }); // iOS保険
 
     return b;
   };
 
   const up = mkBtn("▲", "up");
   const down = mkBtn("▼", "down");
   const left = mkBtn("◀", "left");
   const right = mkBtn("▶", "right");
 
   const empty = () => {
     const s = document.createElement("div");
     s.style.width = "64px";
     s.style.height = "64px";
     return s;
   };
 
   dpad.append(
     empty(), up, empty(),
     left, empty(), right,
     empty(), down, empty()
   );
 
   return dpad;
 }

