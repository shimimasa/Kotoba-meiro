import { createEngine } from "../../game/engine/engine";
import type { Router } from "../router";
import { startLoop } from "../../game/engine/gameLoop";
import type { GameResult } from "../../game/engine/engine";

/**
+ * 目標
+ * 1) HUD重複を削除して、上1本に統一
+ * 2) canvas中央固定＋高さ基準スケール
+ * 3) D-padを左下固定（スマホ時のみ）
+ */
export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.inset = "0";
  wrap.style.background = "#fff";
  wrap.style.overflow = "hidden";
  wrap.style.touchAction = "none";

  // ===== Top HUD (single bar) =====
  const topBar = document.createElement("div");
  topBar.style.position = "fixed";
  topBar.style.left = "0";
  topBar.style.right = "0";
  topBar.style.top = "0";
  topBar.style.display = "flex";
  topBar.style.alignItems = "center";
  topBar.style.justifyContent = "space-between";
  topBar.style.gap = "12px";
  topBar.style.padding = "12px 14px";
  topBar.style.borderBottom = "1px solid rgba(0,0,0,0.06)";
  topBar.style.background = "rgba(255,255,255,0.98)";
  topBar.style.backdropFilter = "blur(6px)";
  topBar.style.zIndex = "50";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "12px";
  left.style.minWidth = "0";

  const center = document.createElement("div");
  center.style.display = "flex";
  center.style.alignItems = "center";
  center.style.justifyContent = "center";
  center.style.flex = "1";
  center.style.minWidth = "0";
  center.style.whiteSpace = "nowrap";
  center.style.overflow = "hidden";
  center.style.textOverflow = "ellipsis";

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "flex-end";
  right.style.flexDirection = "column";
  right.style.gap = "4px";
  right.style.minWidth = "120px";

  const backBtn = createButton("← もどる", () => router.go("start"));
  backBtn.style.borderRadius = "999px";

  const nextLabel = document.createElement("div");
  nextLabel.style.fontSize = "18px";
  nextLabel.style.fontWeight = "700";
  nextLabel.textContent = "つぎ：-";

  const livesWrap = document.createElement("div");
  livesWrap.style.display = "flex";
  livesWrap.style.gap = "4px";

  const progressSmall = document.createElement("div");
  progressSmall.style.fontSize = "13px";
  progressSmall.style.opacity = "0.85";
  progressSmall.textContent = "progress: 0/0";

  const midStatus = document.createElement("div");
  midStatus.style.fontSize = "14px";
  midStatus.style.opacity = "0.9";
  midStatus.textContent = "progress: 0/0 score:0";

  const hintText = document.createElement("div");
  hintText.style.fontSize = "14px";
  hintText.style.fontWeight = "600";
  hintText.textContent = "ヒント：OFF";

  const timeText = document.createElement("div");
  timeText.style.fontSize = "20px";
  timeText.style.fontVariantNumeric = "tabular-nums";
  timeText.textContent = "⏱ 0:00";

  const scoreText = document.createElement("div");
  scoreText.style.fontSize = "16px";
  scoreText.style.fontVariantNumeric = "tabular-nums";
  scoreText.textContent = "score: 0";

  const leftInfo = document.createElement("div");
  leftInfo.style.display = "flex";
  leftInfo.style.flexDirection = "column";
  leftInfo.style.gap = "4px";
  leftInfo.append(nextLabel, livesWrap, progressSmall);

  left.append(backBtn, leftInfo);
  center.append(midStatus);
  right.append(hintText, timeText, scoreText);
  topBar.append(left, center, right);

  // ===== Main (canvas container) =====
  const main = document.createElement("div");
  main.style.position = "absolute";
  main.style.left = "0";
  main.style.right = "0";
  main.style.bottom = "0";
  main.style.display = "flex";
  main.style.alignItems = "center";
  main.style.justifyContent = "center";
  main.style.padding = "10px";
  main.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.background = "#111";
  canvas.style.borderRadius = "8px";
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "100%";
  canvas.style.touchAction = "none";
  main.append(canvas);

  wrap.append(topBar, main);

  // TopBar 高さに合わせて main の top を更新し、canvas は高さ基準でスケール
  const applyLayout = () => {
    const h = topBar.getBoundingClientRect().height;
    main.style.top = `${h}px`;

    const rect = main.getBoundingClientRect();
    const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  };

  // ===== Engine =====
  const settings: any = router.getSettings(); // level 等を含む可能性がある
  const cleanupHandlers: Array<() => void> = [];

  const cleanup = () => {
    for (const fn of cleanupHandlers.splice(0)) fn();
  };

  const engine = createEngine(
    {
      canvas,
      hintEnabled: !!settings.hintEnabled,
      ...(settings.level != null ? { level: settings.level } : {}),
      onResult: (result: GameResult) => {
        cleanup();
        router.setResult(result);
        router.go("result");
      },
      onExit: () => {
        cleanup();
        router.go("start");
      },
    } as any
  );

  const stop = startLoop(engine);
  cleanupHandlers.push(stop);

  // ===== HUD update =====
  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return `${m}:${String(ss).padStart(2, "0")}`;
  };

  const hudTimer = window.setInterval(() => {
    const st = (engine as any).getState?.();
    if (!st) return;

    const next = st.nextLabel ?? st.next ?? st.nextChar ?? "-";
    const lives = st.lives ?? st.life ?? 0;

    const eaten = st.pelletsEaten ?? st.progress ?? 0;
    const total = st.pelletsTotal ?? st.total ?? 0;

    const score = st.score ?? 0;
    const elapsed = st.elapsedSec ?? st.elapsed ?? 0;

    nextLabel.textContent = `つぎ：${next}`;
    progressSmall.textContent = `progress: ${eaten}/${total}`;
    midStatus.textContent = `progress: ${eaten}/${total} score:${score} hint:${settings.hintEnabled ? "ON" : "OFF"}`;

    timeText.textContent = `⏱ ${fmtTime(elapsed)}`;
    scoreText.textContent = `score: ${score}`;
    hintText.textContent = `ヒント：${settings.hintEnabled ? "ON" : "OFF"}`;

    renderLives(livesWrap, lives);
  }, 120);
  cleanupHandlers.push(() => window.clearInterval(hudTimer));

  // ===== D-pad (mobile only, fixed bottom-left) =====
  const dpad = createDpad();
  if (dpad) wrap.append(dpad);

  // ===== Resize =====
  window.addEventListener("resize", applyLayout);
  cleanupHandlers.push(() => window.removeEventListener("resize", applyLayout));
  requestAnimationFrame(applyLayout);

  // 戻るでも cleanup を実行
  backBtn.onclick = () => {
    cleanup();
    router.go("start");
  };

  // ----- D-pad implementation (dispatch keyboard events) -----
  function createDpad(): HTMLElement | null {
    const isMobile =
      window.matchMedia("(max-width: 768px)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (!isMobile) return null;

    const d = document.createElement("div");
    d.style.position = "fixed";
    d.style.left = "18px";
    d.style.bottom = "18px";
    d.style.zIndex = "60";
    d.style.display = "grid";
    d.style.gridTemplateColumns = "56px 56px 56px";
    d.style.gridTemplateRows = "56px 56px 56px";
    d.style.gap = "10px";
    d.style.pointerEvents = "auto";
    d.style.userSelect = "none";
    d.style.webkitUserSelect = "none";

    const dispatchKey = (type: "keydown" | "keyup", key: string) => {
      window.dispatchEvent(new KeyboardEvent(type, { key }));
    };

    const mk = (label: string, key: string, col: number, row: number) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.width = "56px";
      b.style.height = "56px";
      b.style.borderRadius = "14px";
      b.style.border = "1px solid rgba(0,0,0,0.12)";
      b.style.background = "rgba(255,255,255,0.96)";
      b.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)";
      b.style.fontSize = "22px";
      b.style.touchAction = "none";
      b.style.cursor = "pointer";
      b.style.gridColumn = String(col);
      b.style.gridRow = String(row);

      const ac = new AbortController();
      cleanupHandlers.push(() => ac.abort());

      // click
      b.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          dispatchKey("keydown", key);
          dispatchKey("keyup", key);
        },
        { signal: ac.signal }
      );

      // hold-repeat (pointer)
      let timer: number | null = null;
      const start = (e: Event) => {
        e.preventDefault();
        dispatchKey("keydown", key);
        stop();
        timer = window.setInterval(() => dispatchKey("keydown", key), 110);
      };
      const stop = () => {
        if (timer != null) {
          window.clearInterval(timer);
          timer = null;
        }
        dispatchKey("keyup", key);
      };

      b.addEventListener("pointerdown", start, { signal: ac.signal });
      b.addEventListener("pointerup", stop, { signal: ac.signal });
      b.addEventListener("pointercancel", stop, { signal: ac.signal });
      b.addEventListener("pointerleave", stop, { signal: ac.signal });

      return b;
    };

    d.append(
      mk("▲", "ArrowUp", 2, 1),
      mk("◀", "ArrowLeft", 1, 2),
      mk("▶", "ArrowRight", 3, 2),
      mk("▼", "ArrowDown", 2, 3)
    );

    return d;
  }

  return wrap;
}

// ===== UI helpers =====
function createButton(label: string, onClick: () => void) {
 const btn = document.createElement("button");
  btn.textContent = label;
  btn.onclick = onClick;
  btn.style.padding = "10px 14px";
  btn.style.border = "1px solid rgba(0,0,0,0.12)";
  btn.style.background = "#fff";
  btn.style.cursor = "pointer";
  btn.style.userSelect = "none";
  btn.style.webkitUserSelect = "none";
  btn.style.touchAction = "manipulation";
  btn.style.boxShadow = "0 1px 0 rgba(0,0,0,0.06)";
  return btn;
}

function renderLives(host: HTMLElement, lives: number) {
  host.innerHTML = "";
  const filled = Math.max(0, Math.min(5, lives));
  for (let i = 0; i < filled; i++) host.append(makeDot(true));
  for (let i = filled; i < 5; i++) host.append(makeDot(false));
}

function makeDot(filled: boolean) {
  const dot = document.createElement("span");
  dot.textContent = filled ? "●" : "○";
  dot.style.fontSize = "18px";
  return dot;
}