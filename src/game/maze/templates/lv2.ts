import type { MazeTemplate } from "../../maze/types";

/**
 * Lv2: ひらがな（1行ランダム）
 * - 5文字の行だけ使用（やゆよ・わをん等は除外）
 * - 迷路テンプレは固定（2種）
 * - 文字セットだけを毎回差し替える
 */

// 5文字ある行だけ
export const LV2_ROWS: Array<{ id: string; letters: [string, string, string, string, string] }> = [
  { id: "a", letters: ["あ", "い", "う", "え", "お"] },
  { id: "ka", letters: ["か", "き", "く", "け", "こ"] },
  { id: "sa", letters: ["さ", "し", "す", "せ", "そ"] },
  { id: "ta", letters: ["た", "ち", "つ", "て", "と"] },
  { id: "na", letters: ["な", "に", "ぬ", "ね", "の"] },
  { id: "ha", letters: ["は", "ひ", "ふ", "へ", "ほ"] },
  { id: "ma", letters: ["ま", "み", "む", "め", "も"] },
  { id: "ra", letters: ["ら", "り", "る", "れ", "ろ"] },
];

// 文字スロット a,b,c,d,e を置く迷路テンプレ（2種）
const BASE_TEMPLATES: Array<Pick<MazeTemplate, "id" | "description" | "grid">> = [
  {
    id: "lv2-a",
    description: "一本道ベース（Lv2）",
    grid: [
      "###########",
      "#S..a....G#",
      "#.###.###.#",
      "#...b.c...#",
      "#.###.###.#",
      "#...d.e...#",
      "###########",
    ],
  },
  {
    id: "lv2-b",
    description: "回廊型（Lv2）",
    grid: [
      "###########",
      "#S..a..b.G#",
      "#.###.###.#",
      "#...c.....#",
      "#.###.###.#",
      "#..d..e...#",
      "###########",
    ],
  },
];

export function buildAllLv2Templates(): MazeTemplate[] {
  const out: MazeTemplate[] = [];
  for (const base of BASE_TEMPLATES) {
    for (const row of LV2_ROWS) {
      out.push({
        id: `${base.id}-${row.id}`,
        description: `${base.description} / row=${row.id}`,
        grid: base.grid,
        letters: [...row.letters],
      });
    }
  }
  return out;
}

// engine 側で使いやすいように “配列” と “1枚選ぶ関数” を提供
export const lv2Templates: MazeTemplate[] = buildAllLv2Templates();

export function pickLv2Template(rng: () => number = Math.random): MazeTemplate {
  return lv2Templates[Math.floor(rng() * lv2Templates.length)];
}
