import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto 1fr";
  wrap.style.height = "100vh";
  wrap.style.fontFamily = "system-ui, sans-serif";

  // --- top bar
  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";
  top.style.padding = "10px 12px";
  top.style.borderBottom = "1px solid rgba(0,0,0,0.1)";

  const left = document.createElement("button");
  left.textContent = "← もどる";
  left.onclick = () => router.go("start");

  const hint = document.createElement("div");
  hint.style.fontSize = "14px";
  hint.style.opacity = "0.85";
  hint.textContent = router.getSettings().hintEnabled ? "ヒント：ON" : "ヒント：OFF";

  top.append(left, hint);

  // --- main
  const main = document.createElement("div");
  main.style.position = "relative";
  main.style.overflow = "hidden";

  // ✅ canvasはここで1回だけ作る
  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none"; // スワイプ等の入力を妨げない
  canvas.setAttribute("aria-label", "game canvas");

  main.appendChild(canvas);

  wrap.appendChild(top);
  wrap.appendChild(main);

  // --- engine start
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    onExit: () => router.go("start"),
  });

  const stop = startLoop(engine);

  // ✅ removeイベントは当てにならないので、DOMから外れたら止める
  const cleanup = () => stop();
  const mo = new MutationObserver(() => {
    if (!wrap.isConnected) {
      cleanup();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return wrap;
}
