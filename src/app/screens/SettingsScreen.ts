import type { Router } from "../router";
import { defaultSettings } from "../../game/data/settings";

export function SettingsScreen(router: Router): HTMLElement {
  const root = document.createElement("div");
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.minHeight = "100vh";
  root.style.padding = "16px";
  root.style.boxSizing = "border-box";
  root.style.gap = "16px";
  root.style.fontFamily =
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  const top = document.createElement("div");
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.justifyContent = "space-between";

  const back = document.createElement("button");
  back.textContent = "← もどる";
  back.style.padding = "10px 14px";
  back.style.borderRadius = "999px";
  back.style.border = "1px solid #ddd";
  back.style.background = "#fff";
  back.style.cursor = "pointer";
  back.onclick = () => router.go("start");

  const title = document.createElement("div");
  title.textContent = "せってい";
  title.style.fontSize = "20px";
  title.style.fontWeight = "700";

  top.append(back, title);
  root.appendChild(top);

  // Hint toggle
  const hintRow = document.createElement("div");
  hintRow.style.display = "flex";
  hintRow.style.alignItems = "center";
  hintRow.style.justifyContent = "space-between";
  hintRow.style.padding = "12px 14px";
  hintRow.style.border = "1px solid #eee";
  hintRow.style.borderRadius = "12px";
 hintRow.style.background = "#fff";

  const hintLabel = document.createElement("div");
  hintLabel.innerHTML =
    '<div style="font-weight:700">ヒント</div><div style="opacity:.75;font-size:12px">次の文字のガイドを表示</div>';

  const hintBtn = document.createElement("button");
  hintBtn.style.padding = "10px 14px";
  hintBtn.style.borderRadius = "999px";
  hintBtn.style.border = "1px solid #ddd";
  hintBtn.style.background = "#fff";
  hintBtn.style.cursor = "pointer";

  const levelBlock = document.createElement("div");
  levelBlock.style.display = "flex";
  levelBlock.style.flexDirection = "column";
  levelBlock.style.gap = "10px";

  const levelTitle = document.createElement("div");
  levelTitle.innerHTML =
    '<div style="font-weight:700">レベル</div><div style="opacity:.75;font-size:12px">むずかしさをえらぶ</div>';

  const levelRow = document.createElement("div");
  levelRow.style.display = "flex";
  levelRow.style.gap = "10px";
  levelRow.style.flexWrap = "wrap";

  function makeLevelButton(level: number) {
    const b = document.createElement("button");
    b.textContent = `Lv ${level}`;
    b.style.padding = "10px 14px";
    b.style.borderRadius = "999px";
    b.style.border = "1px solid #ddd";
    b.style.background = "#fff";
    b.style.cursor = "pointer";
    b.onclick = () => {
      const s = router.getSettings();
      router.setSettings({ ...s, level });
      sync();
    };
    return b;
  }

  const levelButtons = [1, 2, 3].map(makeLevelButton);
  levelButtons.forEach((b) => levelRow.appendChild(b));

  levelBlock.append(levelTitle, levelRow);

  function sync() {
    const s = router.getSettings();
    hintBtn.textContent = s.hintEnabled ? "ON" : "OFF";
    hintBtn.onclick = () => {
      const cur = router.getSettings();
      router.setSettings({ ...cur, hintEnabled: !cur.hintEnabled });
      sync();
    };

    levelButtons.forEach((b, i) => {
      const lv = i + 1;
      const active = s.level === lv;
      b.style.borderColor = active ? "#222" : "#ddd";
      b.style.fontWeight = active ? "700" : "400";
    });
  }

  hintRow.append(hintLabel, hintBtn);
  root.append(hintRow, levelBlock);

  const startBtn = document.createElement("button");
  startBtn.textContent = "ゲームをはじめる";
  startBtn.style.marginTop = "auto";
  startBtn.style.padding = "14px 16px";
  startBtn.style.borderRadius = "14px";
  startBtn.style.border = "1px solid #222";
  startBtn.style.background = "#222";
  startBtn.style.color = "#fff";
  startBtn.style.cursor = "pointer";
  startBtn.onclick = () => router.go("game");

  root.appendChild(startBtn);

  sync();
  return root;
}