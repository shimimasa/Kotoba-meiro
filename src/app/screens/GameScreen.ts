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

  // --- main
  const main = document.createElement("div");
  main.style.position = "relative";
  main.style.overflow = "hidden";
  main.style.background = "#f7f7f7";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.touchAction = "none";
  canvas.setAttribute("aria-label", "game canvas");
  main.appendChild(canvas);

  wrap.append(top, main);

  // --- engine start
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
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

  return wrap;
}


