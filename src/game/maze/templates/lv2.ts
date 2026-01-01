import type { MazeTemplate } from "../types";

/**
 * Lv2: ひらがな（1行ランダム）
 * - 同一行から5文字（例：かきくけこ）
 * - 迷路テンプレは固定（2種）
 * - 文字セットだけを毎回差し替える
 *
 * 注意：
 * - 「やゆよ」「わをん」など5文字未満の行はLv2では使わない
 */
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

const BASE_TEMPLATES: Array<Omit<MazeTemplate, "letters">> = [
  {
    id: "lv2-a",
    description: "Lv2：一本道ベース・分岐1つ",
    grid: [
      "###########",
      "#S..a....G#",
      "#.###.###.#",
      "#...b.c...#",
      "###.#.#.###",
      "#...d.e...#",
      "#.###.###.#",
      "#.........#",
      "###########",
    ],
  },
  {
    id: "lv2-b",
    description: "Lv2：回廊型・左右対称",
    grid: [
      "###########",
      "#S..a.b...#",
      "#.###.###.#",
      "#...c.....#",
      "###.#.#.###",
      "#.....d.e.#",
      "#.###.###.#",
      "#.......G#",
      "###########",
    ],
  },
];

/**
 * Lv2テンプレを生成（テンプレ2種 × 行ランダム）
 * - random を差し替えれば seed RNG にも対応できる
 */
export function pickLv2Template(random: () => number = Math.random): MazeTemplate {
  const row = LV2_ROWS[Math.floor(random() * LV2_ROWS.length)];
  const base = BASE_TEMPLATES[Math.floor(random() * BASE_TEMPLATES.length)];

  return {
    id: `${base.id}-${row.id}`,
    description: `${base.description} / row=${row.id}`,
    grid: base.grid,
    letters: [...row.letters],
  };
}

/**
 * デバッグ用：全組み合わせを列挙したい場合
 */
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
