
 import type { Router } from "../router";
 import { createEngine } from "../../game/engine/engine"; 

 export function GameScreen(router: Router): HTMLElement {

  const root = document.createElement("div");
   root.className = "screen game";
 
  const isTouch =
    "ontouchstart" in window ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "relative",
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    background: "transparent",
  });

  // ===== Single HUD bar (top only) =====
  const hudBar = document.createElement("div");
  hudBar.style.display = "flex";
  hudBar.style.alignItems = "center";
  hudBar.style.justifyContent = "space-between";
  hudBar.style.padding = "10px 14px";
  hudBar.style.background = "#f5f5f5";
  hudBar.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
  hudBar.style.flex = "0 0 auto";

  const hudLeft = document.createElement("div");
  hudLeft.style.display = "flex";
  hudLeft.style.alignItems = "center";
  hudLeft.style.gap = "14px";

  const back = document.createElement("button");
  back.textContent = "← もどる";
  back.onclick = () => router.go("start");
  back.style.border = "1px solid rgba(0,0,0,0.18)";
  back.style.background = "#fff";
  back.style.padding = "8px 12px";
  back.style.borderRadius = "999px";
  back.style.cursor = "pointer";

  const statusBlock = document.createElement("div");
  statusBlock.style.display = "flex";
  statusBlock.style.flexDirection = "column";
  statusBlock.style.gap = "2px";
  statusBlock.style.lineHeight = "1.15";

  const nextLine = document.createElement("div");
  nextLine.textContent = `つぎ：-`;
  nextLine.style.fontSize = "20px";
  nextLine.style.fontWeight = "700";

  const subLine = document.createElement("div");
  subLine.style.display = "flex";
  subLine.style.gap = "12px";
  subLine.style.fontSize = "14px";
  subLine.style.color = "rgba(0,0,0,0.65)";

  const remainLine = document.createElement("span");
  remainLine.textContent = "あと0こ";

  const livesLine = document.createElement("span");
  livesLine.textContent = "○○○○○";

  subLine.appendChild(remainLine);
  subLine.appendChild(livesLine);

  statusBlock.appendChild(nextLine);
  statusBlock.appendChild(subLine);

  hudLeft.appendChild(back);
  hudLeft.appendChild(statusBlock);

  const hudRight = document.createElement("div");
  hudRight.style.display = "flex";
  hudRight.style.alignItems = "center";
  hudRight.style.gap = "14px";

  const hintLabel = document.createElement("div");
  hintLabel.textContent = `ヒント：${router.getSettings().hintEnabled ? "ON" : "OFF"}`;

  const pcHint = document.createElement("div");
  pcHint.textContent = "←↑→↓でうごかす";
  pcHint.style.fontSize = "12px";
  pcHint.style.color = "rgba(0,0,0,0.55)";
  pcHint.style.display = isTouch ? "none" : "block";

  const timerScore = document.createElement("div");
  timerScore.style.display = "flex";
  timerScore.style.flexDirection = "column";
  timerScore.style.alignItems = "flex-end";
  timerScore.style.fontSize = "14px";
  timerScore.innerHTML = `<div>⏱ 0:00</div><div>score: 0</div>`;

  hudRight.appendChild(hintLabel);
  hudRight.appendChild(pcHint);
  hudRight.appendChild(timerScore);

  hudBar.appendChild(hudLeft);
  hudBar.appendChild(hudRight);

  // ===== メイン（黒背景＋中央固定） =====
  const main = document.createElement("div");
  Object.assign(main.style, {
  width: "100%",
　　flex: "1 1 auto",
    minHeight: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111",
    overflow: "hidden",
    padding: "12px",
    boxSizing: "border-box",
  });

  // 高さ基準でスケール：高さ=利用可能領域、幅=アスペクト比、どちらも上限は画面内
  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "relative",
    height: "100%",
    maxHeight: "100%",
    aspectRatio: "16 / 9",
    width: "auto",
    maxWidth: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#000",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  });

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    width: "100%",
    height: "100%",
    display: "block",
    touchAction: "none",
  });
  frame.appendChild(canvas);
  main.appendChild(frame);

  // ===== Engine =====
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    level: 1,
    onExit: () => router.go("start"),
  });

  // HUD更新（engine.getState() がある前提。無くても落ちない）
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const hudTimer = window.setInterval(() => {
    const st = (engine as any).getState?.();
    if (!st) return;

    const next = st.nextLabel ?? st.next ?? st.nextChar ?? "-";
    const score = st.score ?? 0;
    const timeSec = st.timeSec ?? st.time ?? st.elapsedSec ?? 0;

    const total = st.lettersTotal ?? st.total ?? st.pelletsTotal ?? 0;
    const done = st.lettersCollected ?? st.progress ?? st.pelletsEaten ?? 0;
    const remaining = Math.max(0, Number(total) - Number(done));

    nextLine.textContent = `つぎ：${next}　あと${remaining}こ`;
    subLine.textContent = `score: ${score}  time: ${fmtTime(Number(timeSec) || 0)}`;

    const hintOn = Boolean(st.hintEnabled ?? router.getSettings().hintEnabled);
    hintLabel.textContent = `ヒント：${hintOn ? "ON" : "OFF"}`;
  }, 150);

  // ===== D-pad（スマホ時のみ） =====
  const isCoarse = () => window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const isSmall = () => window.matchMedia?.("(max-width: 900px)").matches ?? false;
  const shouldShowDpad = () => isCoarse() || isSmall();

  const dpad = createDpad();
  wrap.appendChild(dpad.el);

  const updateDpad = () => {
    dpad.el.style.display = shouldShowDpad() ? "grid" : "none";
    pcHint.style.display = shouldShowDpad() ? "none" : "block";
  };
  updateDpad();

  const mq1 = window.matchMedia?.("(pointer: coarse)");
  const mq2 = window.matchMedia?.("(max-width: 900px)");
  const onMq = () => updateDpad();
  mq1?.addEventListener?.("change", onMq);
  mq2?.addEventListener?.("change", onMq);

  function cleanup() {
    window.clearInterval(hudTimer);
    mq1?.removeEventListener?.("change", onMq);
    mq2?.removeEventListener?.("change", onMq);
    dpad.dispose();
    (engine as any).dispose?.();
    (engine as any).stop?.();
  }

  // 画面破棄フック（router側が拾えるなら）
  (wrap as any).cleanup = cleanup;

  wrap.appendChild(hudBar);
  wrap.appendChild(main);
  return wrap;
 }

function createDpad() {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed",
    left: "16px",
    bottom: "16px",
    display: "grid",
    gridTemplateColumns: "64px 64px 64px",
    gridTemplateRows: "64px 64px 64px",
    gap: "10px",
    zIndex: "50",
    userSelect: "none",
    touchAction: "none",
  });

  const mkBtn = (label: string, key: string) => {
    const b = document.createElement("button");
    b.textContent = label;
    Object.assign(b.style, {
      width: "64px",
      height: "64px",
      borderRadius: "16px",
      border: "1px solid rgba(0,0,0,0.15)",
      background: "rgba(255,255,255,0.92)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
      cursor: "pointer",
      fontSize: "22px",
      lineHeight: "1",
    });

    let interval: number | null = null;
    const fire = (type: "keydown" | "keyup") => {
      const ev = new KeyboardEvent(type, { key, bubbles: true });
      window.dispatchEvent(ev);
    };

    const start = (e: PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      fire("keydown");
      interval = window.setInterval(() => fire("keydown"), 120);
    };

    const end = (e: PointerEvent) => {
      e.preventDefault();
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
      fire("keyup");
    };

    b.addEventListener("pointerdown", start);
    b.addEventListener("pointerup", end);
    b.addEventListener("pointercancel", end);
    b.addEventListener("pointerleave", end);

    return {
      b,
      dispose: () => {
        b.removeEventListener("pointerdown", start);
        b.removeEventListener("pointerup", end);
        b.removeEventListener("pointercancel", end);
        b.removeEventListener("pointerleave", end);
      },
    };
  };

  const up = mkBtn("▲", "ArrowUp");
  const left = mkBtn("◀", "ArrowLeft");
  const right = mkBtn("▶", "ArrowRight");
  const down = mkBtn("▼", "ArrowDown");

  el.appendChild(document.createElement("div"));
  el.appendChild(up.b);
  el.appendChild(document.createElement("div"));
  el.appendChild(left.b);
  el.appendChild(document.createElement("div"));
  el.appendChild(right.b);
  el.appendChild(document.createElement("div"));
  el.appendChild(down.b);
  el.appendChild(document.createElement("div"));

  return {
    el,
    dispose: () => {
      up.dispose();
      left.dispose();
      right.dispose();
      down.dispose();
    },
  };
}
