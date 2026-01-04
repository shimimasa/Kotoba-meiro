import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";
import type { GameResult } from "../../game/engine/engine";

type AnyEngine = {
  destroy?: () => void;
  getState?: () => any;
};

function isMobileLike(): boolean {
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)")?.matches;
  return Boolean(coarse) || window.innerWidth < 900;
}

function dispatchArrow(key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") {
  const down = new KeyboardEvent("keydown", { key, bubbles: true });
  const up = new KeyboardEvent("keyup", { key, bubbles: true });
  window.dispatchEvent(down);
  // engine 側が「押しっぱなし」を扱う場合もあるので、短めに離す
  window.setTimeout(() => window.dispatchEvent(up), 16);
}

export function GameScreen(router: Router): HTMLElement {
  // ===== Root layout =====
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.inset = "0";
  wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto 1fr";
  wrap.style.background = "white";
  wrap.style.overflow = "hidden";
  // ===== Top HUD (1本に統一) =====
  const topBar = document.createElement("div");
  topBar.style.display = "flex";
  topBar.style.alignItems = "flex-start";
  topBar.style.justifyContent = "space-between";
  topBar.style.gap = "12px";
  topBar.style.padding = "10px 12px";
  topBar.style.borderBottom = "1px solid #eee";
  topBar.style.background = "white";

  const leftBox = document.createElement("div");
  leftBox.style.display = "flex";
  leftBox.style.alignItems = "flex-start";
  leftBox.style.gap = "12px";

  const backBtn = document.createElement("button");
  backBtn.textContent = "← もどる";
  backBtn.style.padding = "8px 14px";
  backBtn.style.border = "1px solid #ddd";
  backBtn.style.borderRadius = "999px";
  backBtn.style.background = "white";
  backBtn.style.cursor = "pointer";
  backBtn.onclick = () => router.go("start");

  const leftHud = document.createElement("div");
  leftHud.style.display = "flex";
  leftHud.style.flexDirection = "column";
  leftHud.style.gap = "4px";
  leftHud.style.paddingTop = "2px";

  const nextEl = document.createElement("div");
  nextEl.style.fontSize = "18px";
  nextEl.style.fontWeight = "700";
  nextEl.textContent = "つぎ: -";

  const dotsEl = document.createElement("div");
  dotsEl.style.fontSize = "18px";
  dotsEl.textContent = "○○○○○";

  const progressEl = document.createElement("div");
  progressEl.style.fontSize = "16px";
  progressEl.textContent = "progress: 0/0";

  leftHud.appendChild(nextEl);
  leftHud.appendChild(dotsEl);
  leftHud.appendChild(progressEl);

  leftBox.appendChild(backBtn);
  leftBox.appendChild(leftHud);

  const rightBox = document.createElement("div");
  rightBox.style.display = "flex";
  rightBox.style.flexDirection = "column";
  rightBox.style.alignItems = "flex-end";
  rightBox.style.gap = "6px";
  rightBox.style.paddingTop = "2px";

  const hintLabel = document.createElement("div");
  hintLabel.textContent = "ヒント : ON";
  hintLabel.style.fontSize = "18px";
  hintLabel.style.fontWeight = "700";

  const timeEl = document.createElement("div");
  timeEl.style.fontSize = "18px";
  timeEl.textContent = "⏱ 0:00";

  const scoreEl = document.createElement("div");
  scoreEl.style.fontSize = "18px";
  scoreEl.textContent = "score: 0";

  rightBox.appendChild(hintLabel);
  rightBox.appendChild(timeEl);
  rightBox.appendChild(scoreEl);

  topBar.appendChild(leftBox);
  topBar.appendChild(rightBox);
  wrap.appendChild(topBar);

  // ===== Main (canvas 중앙固定 + 高さ基準スケール) =====
  const main = document.createElement("div");
  main.style.display = "flex";
  main.style.alignItems = "center";
  main.style.justifyContent = "center";
  main.style.padding = "12px";
  main.style.minHeight = "0";
  main.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.background = "#111";
  canvas.style.borderRadius = "8px";
  canvas.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
  // 高さを基準に（縦に収まるように）スケール。横は auto で追従。
  canvas.style.height = "min(calc(100dvh - 120px), 760px)";
  canvas.style.width = "auto";
  canvas.style.maxWidth = "min(96vw, 980px)";

  main.appendChild(canvas);
  wrap.appendChild(main);

  // ===== Engine =====
  const settings = router.getSettings();

  // createEngine 側が「level必須」の型になっている環境でも動くように安全に渡す
  const engine = createEngine({
    canvas,
    hintEnabled: settings.hintEnabled,
    level: settings.level,
    onResult: (result: GameResult) => {
      router.setResult(result);
      router.go("result");
    },
    onExit: () => router.go("start"),
  }) as unknown as AnyEngine;

  const stop = startLoop(engine as any);

  // ===== HUD refresh (DOM側のみ) =====
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const hudTimer = window.setInterval(() => {
    const st =
      (engine.getState?.() ?? (engine as any).state ?? null) as any | null;
    if (!st) return;

    // 次の文字
    const next = st.nextLabel ?? st.next ?? st.nextChar ?? "-";
    nextEl.textContent = `つぎ: ${next}`;

    // ライフ
    const lives: number = st.lives ?? st.life ?? 0;
    const maxLives: number = st.maxLives ?? st.maxLife ?? 5;
    const filled = "●".repeat(Math.max(0, Math.min(lives, maxLives)));
    const empty = "○".repeat(Math.max(0, maxLives - Math.min(lives, maxLives)));
    dotsEl.textContent = filled + empty;

    // progress
    const eaten = st.pelletsEaten ?? st.progress ?? st.lettersCollected ?? 0;
    const total = st.pelletsTotal ?? st.total ?? st.lettersTotal ?? 0;
    progressEl.textContent = `progress: ${eaten}/${total}`;

    // time / score
    const t = st.timeSec ?? st.time ?? 0;
    const score = st.score ?? 0;
    timeEl.textContent = `⏱ ${fmtTime(Number(t) || 0)}`;
    scoreEl.textContent = `score: ${Number(score) || 0}`;

    // hint label
    hintLabel.textContent = `ヒント : ${st.hintEnabled ?? settings.hintEnabled ? "ON" : "OFF"}`;
  }, 120);

  // ===== D-pad (左下固定 / スマホのみ) =====
  const dpadWrap = document.createElement("div");
  dpadWrap.style.position = "fixed";
  dpadWrap.style.left = "16px";
  dpadWrap.style.bottom = "16px";
  dpadWrap.style.zIndex = "60";
  dpadWrap.style.display = "none";
  dpadWrap.style.gap = "14px";
  dpadWrap.style.alignItems = "center";
  dpadWrap.style.justifyContent = "center";
  dpadWrap.style.userSelect = "none";
  dpadWrap.style.touchAction = "none";

  // 2x3 の簡易グリッド（中央空白）
  dpadWrap.style.display = "grid";
  dpadWrap.style.gridTemplateColumns = "64px 64px 64px";
  dpadWrap.style.gridTemplateRows = "64px 64px 64px";
  dpadWrap.style.gap = "10px";

  const mkBtn = (label: string) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.width = "64px";
    b.style.height = "64px";
    b.style.borderRadius = "14px";
    b.style.border = "1px solid #ddd";
    b.style.background = "rgba(255,255,255,0.92)";
    b.style.boxShadow = "0 10px 25px rgba(0,0,0,0.10)";
    b.style.fontSize = "22px";
    b.style.cursor = "pointer";
    b.style.touchAction = "none";
    return b;
  };

  const btnUp = mkBtn("▲");
  const btnDown = mkBtn("▼");
  const btnLeft = mkBtn("◀");
  const btnRight = mkBtn("▶");

  // 配置
  // (0,1)=up / (1,0)=left / (1,2)=right / (2,1)=down
  btnUp.style.gridColumn = "2";
  btnUp.style.gridRow = "1";
  btnLeft.style.gridColumn = "1";
  btnLeft.style.gridRow = "2";
  btnRight.style.gridColumn = "3";
  btnRight.style.gridRow = "2";
  btnDown.style.gridColumn = "2";
  btnDown.style.gridRow = "3";

  dpadWrap.appendChild(btnUp);
  dpadWrap.appendChild(btnLeft);
  dpadWrap.appendChild(btnRight);
 dpadWrap.appendChild(btnDown);
  wrap.appendChild(dpadWrap);

  const bindHold = (el: HTMLButtonElement, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") => {
    let intervalId: number | null = null;
    const start = () => {
      dispatchArrow(key);
      if (intervalId != null) return;
      intervalId = window.setInterval(() => dispatchArrow(key), 70);
    };
    const stop = () => {
      if (intervalId != null) window.clearInterval(intervalId);
      intervalId = null;
    };

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      start();
    });
    el.addEventListener("pointerup", (e) => {
      e.preventDefault();
      stop();
    });
    el.addEventListener("pointercancel", stop);
    el.addEventListener("pointerleave", stop);

    return stop;
  };

  const stopUp = bindHold(btnUp, "ArrowUp");
  const stopDown = bindHold(btnDown, "ArrowDown");
  const stopLeft = bindHold(btnLeft, "ArrowLeft");
  const stopRight = bindHold(btnRight, "ArrowRight");

  const updateDpadVisibility = () => {
    dpadWrap.style.display = isMobileLike() ? "grid" : "none";
  };
  updateDpadVisibility();
  window.addEventListener("resize", updateDpadVisibility);

  // ===== Cleanup =====
  wrap.addEventListener("DOMNodeRemoved", () => {
    // 念のため（routerが差し替えでDOMをまるごと入れ替える場合）
    window.removeEventListener("resize", updateDpadVisibility);
    stopUp();
    stopDown();
    stopLeft();
    stopRight();
    window.clearInterval(hudTimer);
    stop?.();
    engine.destroy?.();
  });

  return wrap;
}
