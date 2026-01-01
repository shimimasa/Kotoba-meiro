import type { Router } from "../router";
import type { Settings } from "../../game/data/settings";

export function SettingsScreen(router: Router): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "grid";
  wrap.style.gap = "12px";
  wrap.style.padding = "20px";
  wrap.style.fontFamily = "system-ui, sans-serif";

  const h = document.createElement("h2");
  h.textContent = "おとなのせってい";
  h.style.margin = "0 0 8px 0";

  const current = router.getSettings();

  const hintRow = document.createElement("label");
  hintRow.style.display = "flex";
  hintRow.style.alignItems = "center";
  hintRow.style.gap = "10px";

  const hint = document.createElement("input");
  hint.type = "checkbox";
  hint.checked = current.hintEnabled;

  const hintText = document.createElement("span");
  hintText.textContent = "ヒントを表示する（つぎの文字を出す）";

  hintRow.append(hint, hintText);

  const note = document.createElement("div");
  note.textContent = "※ ゲーム中は変更できません。";
  note.style.fontSize = "12px";
  note.style.opacity = "0.7";

  const back = document.createElement("button");
  back.textContent = "← もどる";
  back.style.padding = "10px 14px";
  back.onclick = () => router.go("start");

  hint.addEventListener("change", () => {
    const next: Settings = { ...router.getSettings(), hintEnabled: hint.checked };
    router.setSettings(next);
  });

  wrap.append(h, hintRow, note, back);
  return wrap;
}
