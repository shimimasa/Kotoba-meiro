import type { Router } from "../router";
import { createEngine } from "../../game/engine/engine";
import { startLoop } from "../../game/engine/gameLoop";

export function GameScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gridTemplateRows = "auto 1fr";
  wrap.style.height = "100vh";
  wrap.style.fontFamily = "system-ui, sans-serif";

  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";
  top.style.padding = "10px 12px";

  const left = document.createElement("button");
  left.textContent = "← もどる";
  left.onclick = () => router.go("start");

  const hint = document.createElement("div");
  hint.style.fontSize = "14px";
  hint.style.opacity = "0.85";
  hint.textContent = router.getSettings().hintEnabled ? "ヒント：ON" : "ヒント：OFF";

  top.append(left, hint);

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.touchAction = "none"; // スワイプ検出のため
  wrap.append(top, canvas);

  // エンジン起動
  const engine = createEngine({
    canvas,
    hintEnabled: router.getSettings().hintEnabled,
    onExit: () => router.go("start"),
  });

  const stop = startLoop(engine);

  // 画面離脱時に停止
  wrap.addEventListener("remove", () => stop());

  return wrap;
}
