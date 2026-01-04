// src/app/screens/StartScreen.ts
import type { Router } from "../router";
import { createSfx } from "../../game/audio/sfx";

const sfx = createSfx();

export function StartScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.minHeight = "100vh";
  wrap.style.display = "grid";
  wrap.style.placeItems = "center";
  wrap.style.background = "white";
  wrap.style.padding = "24px";

  const card = document.createElement("div");
  card.style.width = "min(520px, 92vw)";
  card.style.border = "1px solid #eee";
  card.style.borderRadius = "16px";
  card.style.padding = "18px 16px";
  card.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";

  const title = document.createElement("h1");
  title.textContent = "Kotoba Meiro";
  title.style.margin = "0 0 8px 0";
  title.style.fontSize = "22px";

  const desc = document.createElement("p");
  desc.textContent = "D-pad / キーボードで迷路を進もう。";
  desc.style.margin = "0 0 14px 0";
  desc.style.opacity = "0.8";

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "10px";
  buttons.style.justifyContent = "center";
  buttons.style.flexWrap = "wrap";

  const start = document.createElement("button");
  start.textContent = "はじめる";
  start.style.padding = "12px 18px";
  start.style.borderRadius = "12px";
  start.style.border = "1px solid #ddd";
  start.style.background = "white";
  start.style.cursor = "pointer";
  start.onclick = () => {
    // iOS対策：最初のユーザー操作で音を解放
    try { sfx.unlock(); } catch {}
    router.go("game");
  };

  const settings = document.createElement("button");
  settings.textContent = "せってい";
  settings.style.padding = "12px 18px";
  settings.style.borderRadius = "12px";
  settings.style.border = "1px solid #ddd";
  settings.style.background = "white";
  settings.style.cursor = "pointer";
  settings.onclick = () => router.go("settings");

  buttons.append(start, settings);
  card.append(title, desc, buttons);
  wrap.append(card);
  return wrap;
}
