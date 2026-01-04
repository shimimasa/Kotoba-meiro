import type { Router } from "../router";
import type { Settings } from "../../game/data/settings";

export function SettingsScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.padding = "24px";
  wrap.style.fontFamily = "system-ui, sans-serif";

  const title = document.createElement("h2");
  title.textContent = "Settings";
  wrap.appendChild(title);
  const hintRow = document.createElement("div");
  hintRow.style.display = "flex";
  hintRow.style.alignItems = "center";
  hintRow.style.gap = "12px";
  hintRow.style.marginTop = "16px";

  const hintLabel = document.createElement("div");
  hintLabel.textContent = "ヒント";

  const hintToggle = document.createElement("button");
  hintToggle.style.padding = "10px 14px";
  hintToggle.style.borderRadius = "999px";
  hintToggle.style.border = "1px solid #ddd";
  hintToggle.style.background = "white";
  hintToggle.style.cursor = "pointer";

  const s = router.getSettings();
  let hintEnabled = s.hintEnabled ?? true;
  // level（型に無い可能性があるので any 経由）
  let level = (s as any).level ?? 1;

  const renderHint = () => {
    hintToggle.textContent = hintEnabled ? "ON" : "OFF";
  };
  renderHint();

  hintToggle.onclick = () => {
    hintEnabled = !hintEnabled;
    renderHint();
    router.setSettings({ ...(router.getSettings() as any), hintEnabled, level } as any);
  };

  hintRow.append(hintLabel, hintToggle);
  wrap.appendChild(hintRow);

  // --- Level ---
  const lvRow = document.createElement("div");
  lvRow.style.display = "flex";
  lvRow.style.alignItems = "center";
  lvRow.style.gap = "12px";
  lvRow.style.marginTop = "16px";

  const lvLabel = document.createElement("div");
  lvLabel.textContent = "レベル";

  const lv1Btn = document.createElement("button");
  const lv2Btn = document.createElement("button");
  for (const b of [lv1Btn, lv2Btn]) {
    b.style.padding = "10px 14px";
    b.style.borderRadius = "12px";
    b.style.border = "1px solid #ddd";
    b.style.background = "white";
    b.style.cursor = "pointer";
  }
  lv1Btn.textContent = "Lv1";
  lv2Btn.textContent = "Lv2";

  const renderLv = () => {
    lv1Btn.style.fontWeight = level === 1 ? "700" : "400";
    lv2Btn.style.fontWeight = level === 2 ? "700" : "400";
  };
  renderLv();

  lv1Btn.onclick = () => {
    level = 1;
    renderLv();
    router.setSettings({ ...(router.getSettings() as any), hintEnabled, level } as any);
  };
  lv2Btn.onclick = () => {
    level = 2;
    renderLv();
    router.setSettings({ ...(router.getSettings() as any), hintEnabled, level } as any);
  };

  lvRow.append(lvLabel, lv1Btn, lv2Btn);
  wrap.appendChild(lvRow);

  const back = document.createElement("button");
  back.textContent = "← もどる";
  back.style.marginTop = "24px";
  back.style.padding = "10px 14px";
  back.style.borderRadius = "12px";
  back.style.border = "1px solid #ddd";
  back.style.background = "white";
  back.style.cursor = "pointer";
  back.onclick = () => router.go("start");

  wrap.appendChild(back);
  return wrap;
}