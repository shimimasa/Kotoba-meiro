import type { Router } from "../router";
import { createSfx } from "../../game/audio/sfx";

const sfx = createSfx();


export function StartScreen(router: Router): HTMLElement {
  const startButton = document.createElement("button");
  startButton.textContent = "はじめる";
  startButton.style.padding = "12px 18px";
  startButton.onclick = async () => {
    sfx.unlock();
    router.go("game");
  };

  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.placeItems = "center";
  wrap.style.minHeight = "100vh";
  wrap.style.gap = "16px";
  wrap.style.padding = "24px";
  wrap.style.fontFamily = "system-ui, sans-serif";

  const title = document.createElement("h1");
  title.textContent = "ことばめいろ";
  title.style.margin = "0";
  title.style.fontSize = "42px";

  const desc = document.createElement("div");
  desc.textContent = "あ→い→う→え→お の順に集めて、Gへ！";
  desc.style.opacity = "0.85";

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "10px";

  const start = document.createElement("button");
  start.textContent = "はじめる";
  start.style.padding = "12px 18px";
  start.onclick = () => router.go("game");

  const settings = document.createElement("button");
  settings.textContent = "せってい";
  settings.style.padding = "12px 18px";
  settings.onclick = () => router.go("settings");

  buttons.append(start, settings);
  wrap.append(title, desc, buttons);
  return wrap;
}
