import type { Router } from "../router";
import type { GameResult } from "../../game/engine/engine";

function fmtTime(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m > 0 ? `${m}分${r}秒` : `${r}秒`;
}

export function ResultScreen(router: Router): HTMLElement {
  const r0 = router.getResult();
  if (!r0) {
    // 結果が無い状態でResultに来た場合はStartへ戻す
    router.go("start");
    const fallback = document.createElement("div");
    fallback.textContent = "結果が見つかりませんでした。";
    return fallback;
  }
  const r: GameResult = r0;
  if (!r) {
    // 念のため
    const wrap = document.createElement("div");
    wrap.textContent = "結果がありません。";
    return wrap;
  }

  const wrap = document.createElement("div");
  wrap.style.minHeight = "100vh";
  wrap.style.display = "grid";
  wrap.style.placeItems = "center";
  wrap.style.padding = "24px";
  wrap.style.fontFamily = "system-ui, sans-serif";
  wrap.style.background = "#f7f7f7";

  const card = document.createElement("div");
  card.style.width = "min(520px, 92vw)";
  card.style.background = "white";
  card.style.border = "1px solid rgba(0,0,0,0.12)";
  card.style.borderRadius = "18px";
  card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)";
  card.style.padding = "18px 18px 16px";

  const title = document.createElement("h1");
  title.textContent = "クリア！";
  title.style.margin = "6px 0 10px";
  title.style.fontSize = "40px";

  const sub = document.createElement("div");
  sub.textContent = "おつかれさま！結果を見よう";
  sub.style.opacity = "0.8";
  sub.style.marginBottom = "14px";

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "10px";
  grid.style.marginBottom = "14px";

  const item = (label: string, value: string) => {
    const box = document.createElement("div");
    box.style.border = "1px solid rgba(0,0,0,0.10)";
    box.style.borderRadius = "14px";
    box.style.padding = "12px";

    const l = document.createElement("div");
    l.textContent = label;
    l.style.fontSize = "13px";
    l.style.opacity = "0.7";

    const v = document.createElement("div");
    v.textContent = value;
    v.style.fontSize = "22px";
    v.style.fontWeight = "700";
    v.style.marginTop = "6px";

    box.append(l, v);
    return box;
  };

  grid.append(
    item("タイム", fmtTime(r.timeSec)),
    item("スコア", String(r.score)),
    item("ペレット", `${r.pelletsEaten}/${r.pelletsTotal}`),
    item("文字", `${r.lettersCollected}/${r.lettersTotal}`),
  );

  const note = document.createElement("div");
  note.style.fontSize = "13px";
  note.style.opacity = "0.75";
  note.textContent = `ヒント：${r.hintEnabled ? "ON" : "OFF"}`;

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "10px";
  buttons.style.justifyContent = "flex-end";
  buttons.style.marginTop = "16px";

  const retry = document.createElement("button");
  retry.textContent = "もういちど";
  retry.style.padding = "10px 14px";
  retry.style.borderRadius = "12px";
  retry.style.border = "1px solid rgba(0,0,0,0.18)";
  retry.style.background = "white";
  retry.style.cursor = "pointer";
  retry.onclick = () => router.go("game");

  const toStart = document.createElement("button");
  toStart.textContent = "スタートへ";
  toStart.style.padding = "10px 14px";
  toStart.style.borderRadius = "12px";
  toStart.style.border = "1px solid rgba(0,0,0,0.18)";
  toStart.style.background = "white";
  toStart.style.cursor = "pointer";
  toStart.onclick = () => router.go("start");


  const nextBtn = document.createElement("button");
  nextBtn.textContent = "つぎへ";
  nextBtn.style.padding = "10px 14px";
  nextBtn.style.borderRadius = "12px";
  nextBtn.style.border = "1px solid rgba(0,0,0,0.18)";
  nextBtn.style.background = "white";
  nextBtn.style.cursor = "pointer";
  nextBtn.onclick = () => {
    const s = router.getSettings();
    const nextLevel = Math.min(2, (s.level ?? 1) + 1);
    router.setSettings({ ...s, level: nextLevel });
    router.go("game");
  };

  buttons.append(nextBtn, retry, toStart);


  card.append(title, sub, grid, note, buttons);
  wrap.appendChild(card);
  return wrap;
}
