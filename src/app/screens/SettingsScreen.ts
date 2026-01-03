import type { Router } from "../router";
import type { Settings } from "../../game/data/settings";

export function SettingsScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "12px";
  wrap.style.padding = "20px";
  wrap.style.fontFamily = "system-ui, sans-serif";
  wrap.style.maxWidth = "520px";

  const h = document.createElement("h2");
  h.textContent = "おとなのせってい";
  h.style.margin = "0 0 8px 0";

  const current = router.getSettings();

  // ---- Hint row
  const hintRow = document.createElement("div");
  hintRow.style.display = "flex";
  hintRow.style.alignItems = "center";
  hintRow.style.justifyContent = "space-between";
  hintRow.style.gap = "12px";
  hintRow.style.padding = "12px 14px";
  hintRow.style.border = "1px solid rgba(0,0,0,0.12)";
  hintRow.style.borderRadius = "14px";
  hintRow.style.background = "white";

  const hintLabel = document.createElement("div");
  hintLabel.textContent = "ヒントを表示";
  hintLabel.style.fontWeight = "700";

  const hint = document.createElement("input");
  hint.type = "checkbox";
  hint.checked = !!current.hintEnabled;
  hint.style.transform = "scale(1.2)";
  hint.style.cursor = "pointer";

  hintRow.append(hintLabel, hint);

  // ---- Level row（追加）
  const levelRow = document.createElement("div");
  levelRow.style.display = "flex";
  levelRow.style.alignItems = "center";
  levelRow.style.justifyContent = "space-between";
  levelRow.style.gap = "12px";
  levelRow.style.padding = "12px 14px";
  levelRow.style.border = "1px solid rgba(0,0,0,0.12)";
  levelRow.style.borderRadius = "14px";
  levelRow.style.background = "white";

  const levelLabel = document.createElement("div");
  levelLabel.textContent = "レベル";
  levelLabel.style.fontWeight = "700";

  const levelSelect = document.createElement("select");
  levelSelect.style.padding = "8px 10px";
  levelSelect.style.borderRadius = "10px";
  levelSelect.style.border = "1px solid rgba(0,0,0,0.18)";
  levelSelect.style.background = "white";
  levelSelect.style.cursor = "pointer";
  levelSelect.innerHTML = `
    <option value="1">Lv1</option>
    <option value="2">Lv2</option>
  `;
  levelSelect.value = String(current.level ?? 1);

  levelRow.append(levelLabel, levelSelect);

  // ---- Note
  const note = document.createElement("div");
  note.style.fontSize = "13px";
  note.style.opacity = "0.75";
  note.textContent = "※設定は自動で保存されます";

  // ---- Back
  const back = document.createElement("button");
  back.textContent = "← もどる";
  back.style.padding = "10px 14px";
  back.style.borderRadius = "12px";
  back.style.border = "1px solid rgba(0,0,0,0.15)";
  back.style.background = "white";
  back.style.cursor = "pointer";
  back.onclick = () => router.go("start");

  // ---- Events
  hint.addEventListener("change", () => {
    const next: Settings = { ...router.getSettings(), hintEnabled: hint.checked };
    router.setSettings(next);
  });

  levelSelect.addEventListener("change", () => {
    const nextLevel = Number(levelSelect.value);
    const next: Settings = { ...router.getSettings(), level: nextLevel };
    router.setSettings(next);
  });

  wrap.append(h, hintRow, levelRow, note, back);
  return wrap;
}
