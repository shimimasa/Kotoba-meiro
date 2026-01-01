import type { Router } from "../router";

export function StartScreen(router: Router): HTMLElement {
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

  const copy = document.createElement("div");
  copy.textContent = "たべて、すすんで、ことばがわかる。";
  copy.style.fontSize = "18px";
  copy.style.opacity = "0.85";

  const startBtn = document.createElement("button");
  startBtn.textContent = "▶ はじめる";
  startBtn.style.fontSize = "18px";
  startBtn.style.padding = "12px 18px";
  startBtn.onclick = () => router.go("game");

  const settingsBtn = document.createElement("button");
  settingsBtn.textContent = "⚙ おとなのせってい（長押し）";
  settingsBtn.style.fontSize = "14px";
  settingsBtn.style.padding = "10px 14px";
  settingsBtn.style.opacity = "0.9";

  // 長押し3秒
  let pressTimer: number | null = null;
  const startPress = () => {
    pressTimer = window.setTimeout(() => router.go("settings"), 3000);
  };
  const endPress = () => {
    if (pressTimer) window.clearTimeout(pressTimer);
    pressTimer = null;
  };
  settingsBtn.addEventListener("pointerdown", startPress);
  settingsBtn.addEventListener("pointerup", endPress);
  settingsBtn.addEventListener("pointercancel", endPress);
  settingsBtn.addEventListener("pointerleave", endPress);

  wrap.append(title, copy, startBtn, settingsBtn);
  return wrap;
}
