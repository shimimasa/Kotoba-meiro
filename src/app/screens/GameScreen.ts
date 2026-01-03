import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto 1fr";
  wrap.style.height = "100vh";
  wrap.style.fontFamily = "system-ui, sans-serif";
  wrap.style.background = "white";

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

  // --- main (canvas container)
  const main = document.createElement("div");
  main.style.position = "relative";
  main.style.overflow = "hidden";
  main.style.background = "#f7f7f7";
  main.style.touchAction = "none"; // スクロール/ピンチ干渉を減らす

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none"; // 重要
  canvas.setAttribute("aria-label", "game canvas");
  main.appendChild(canvas);

  // ===== Mobile D-pad =====
  // engine が window でも canvas でも keydown を受け取れるように、両方に投げる
  const fireKey = (key: string) => {
    const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    window.dispatchEvent(ev);
    canvas.dispatchEvent(ev);
  };

  const startRepeat = (key: string) => {
    fireKey(key); // まず1回
    const id = window.setInterval(() => fireKey(key), 90); // 60〜120msで好み調整
    return () => window.clearInterval(id);
  };

  const createDpad = () => {
    const pad = document.createElement("div");
    pad.setAttribute("aria-label", "D-pad");
    pad.style.position = "absolute";
    pad.style.left = "12px";
    pad.style.bottom = "12px";
    pad.style.width = "150px";
    pad.style.height = "150px";
    pad.style.display = "grid";
    pad.style.gridTemplateColumns = "1fr 1fr 1fr";
    pad.style.gridTemplateRows = "1fr 1fr 1fr";
    pad.style.gap = "10px";
    pad.style.pointerEvents = "auto";
    pad.style.userSelect = "none";
    pad.style.touchAction = "none";
    pad.style.zIndex = "10";

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
      b.style.fontSize = "20px";
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
        // iOS/Androidで pointerup が外れた時も拾えるようにする
        try {
          (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        } catch {}
        if (stop) return;
        stop = startRepeat(key);
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

    // 十字配置
    pad.append(
      mkBtn("▲", "ArrowUp", 2, 1),
      mkBtn("◀", "ArrowLeft", 1, 2),
      mkBtn("▶", "ArrowRight", 3, 2),
      mkBtn("▼", "ArrowDown", 2, 3)
    );

    return pad;
  };

  // D-pad を canvas の上に重ねる
  const dpad = createDpad();
  main.appendChild(dpad);

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

  // DOMから外れたら止める
  const mo = new MutationObserver(() => {
    if (!wrap.isConnected) {
      stop();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  wrap.append(top, main);
  return wrap;
}
