import type { Router } from "../router";

/**
 * SettingsScreen
 * - ヒントON/OFF
 * - レベル選択（Lv1/Lv2/Lv3）
 * - 画面が真っ暗にならないよう、背景とカードのコントラストを固定
 */
export function SettingsScreen(router: Router): HTMLElement {
  injectStyleOnce(
    "screen-settings-style",
    `
    .settingsRoot{
      height: 100dvh;
      width: 100%;
      background: #0b0b0b;
      color: #111;
      overflow: hidden;
      display:flex;
      flex-direction: column;
    }
    .settingsTop{
      display:flex;
      align-items:center;
      justify-content: space-between;
      padding: 14px 14px;
      box-sizing: border-box;
    }
    .btn{
      appearance:none;
      border: 1px solid rgba(255,255,255,0.22);
      background: rgba(255,255,255,0.92);
      color:#111;
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 14px;
      cursor:pointer;
    }
    .btn:active{ transform: translateY(1px); }

    .settingsBody{
      flex: 1;
      display:flex;
      align-items:flex-start;
      justify-content:center;
      padding: 18px 14px;
      box-sizing:border-box;
    }
    .card{
      width: min(980px, 100%);
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 18px 44px rgba(0,0,0,0.35);
      padding: 18px 18px 14px;
      box-sizing:border-box;
    }

    .row{
      display:flex;
      align-items:center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 10px;
      border: 1px solid rgba(0,0,0,0.08);
      border-radius: 14px;
      background: #fafafa;
    }
    .row + .row{ margin-top: 12px; }

    .rowTitle{
      font-weight: 700;
      margin-bottom: 2px;
    }
    .rowDesc{
      font-size: 12px;
      opacity: .75;
    }

    .pill{
      border-radius: 999px;
      padding: 10px 14px;
      border: 1px solid rgba(0,0,0,0.12);
      background: #fff;
      cursor:pointer;
      font-weight: 700;
    }
    .pillActive{
      background: #111;
      color:#fff;
      border-color: #111;
    }

    .levels{
      display:flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items:center;
      justify-content:flex-start;
    }

    .footer{
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 12px 14px 14px;
      box-sizing: border-box;
      background: linear-gradient(to top, rgba(11,11,11,0.98), rgba(11,11,11,0));
    }
    .startBtn{
      width: 100%;
      max-width: 980px;
      margin: 0 auto;
      display:block;
      padding: 14px 18px;
      font-size: 16px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.92);
      color:#111;
      cursor:pointer;
      box-shadow: 0 14px 30px rgba(0,0,0,0.28);
    }
    `
  );

  const settings = router.getSettings();

  const root = document.createElement("div");
  root.className = "settingsRoot";

  const top = document.createElement("div");
  top.className = "settingsTop";

  const backBtn = document.createElement("button");
  backBtn.className = "btn";
  backBtn.textContent = "← もどる";
  backBtn.addEventListener("click", () => router.go("start"));

  const title = document.createElement("div");
  title.style.color = "rgba(255,255,255,0.85)";
  title.style.fontWeight = "700";
  title.textContent = "せってい";

  top.appendChild(backBtn);
  top.appendChild(title);

  const body = document.createElement("div");
  body.className = "settingsBody";

  const card = document.createElement("div");
  card.className = "card";

  // --- Hint row ---
  const hintRow = document.createElement("div");
  hintRow.className = "row";

  const hintLeft = document.createElement("div");
  const hintTitle = document.createElement("div");
  hintTitle.className = "rowTitle";
  hintTitle.textContent = "ヒント";
  const hintDesc = document.createElement("div");
  hintDesc.className = "rowDesc";
  hintDesc.textContent = "次の文字のガイドを表示";
  hintLeft.appendChild(hintTitle);
  hintLeft.appendChild(hintDesc);

  const hintBtn = document.createElement("button");
  hintBtn.className = "pill";
  hintBtn.textContent = settings.hintEnabled ? "ON" : "OFF";
  hintBtn.addEventListener("click", () => {
    const cur = router.getSettings();
    const next = { ...cur, hintEnabled: !cur.hintEnabled };
    router.setSettings(next);
    hintBtn.textContent = next.hintEnabled ? "ON" : "OFF";
  });

  hintRow.appendChild(hintLeft);
  hintRow.appendChild(hintBtn);

  // --- Level row ---
  const levelRow = document.createElement("div");
  levelRow.className = "row";

  const levelLeft = document.createElement("div");
  const levelTitle = document.createElement("div");
  levelTitle.className = "rowTitle";
  levelTitle.textContent = "レベル";
  const levelDesc = document.createElement("div");
  levelDesc.className = "rowDesc";
  levelDesc.textContent = "むずかしさをえらぶ";
  levelLeft.appendChild(levelTitle);
  levelLeft.appendChild(levelDesc);

  const levels = document.createElement("div");
  levels.className = "levels";

  const mkLevel = (lv: number) => {
    const b = document.createElement("button");
    b.className = "pill";
    b.textContent = `Lv ${lv}`;
    const applyActive = () => {
      const cur = router.getSettings();
      b.classList.toggle("pillActive", (cur.level ?? 1) === lv);
    };
    b.addEventListener("click", () => {
      const cur = router.getSettings();
      router.setSettings({ ...cur, level: lv });
      // 全ボタン更新
      Array.from(levels.querySelectorAll("button")).forEach((x) => x.classList.remove("pillActive"));
      b.classList.add("pillActive");
    });
    applyActive();
    return b;
  };

  levels.appendChild(mkLevel(1));
  levels.appendChild(mkLevel(2));
  levels.appendChild(mkLevel(3));

  levelRow.appendChild(levelLeft);
  levelRow.appendChild(levels);

  card.appendChild(hintRow);
  card.appendChild(levelRow);

  body.appendChild(card);

  // --- Footer start ---
  const footer = document.createElement("div");
  footer.className = "footer";

  const startBtn = document.createElement("button");
  startBtn.className = "startBtn";
  startBtn.textContent = "ゲームをはじめる";
  startBtn.addEventListener("click", () => router.go("game"));

  footer.appendChild(startBtn);

  root.appendChild(top);
  root.appendChild(body);
  root.appendChild(footer);

  return root;
}

/* ---------------- helpers ---------------- */

function injectStyleOnce(id: string, cssText: string) {
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = cssText;
  document.head.appendChild(style);
}
