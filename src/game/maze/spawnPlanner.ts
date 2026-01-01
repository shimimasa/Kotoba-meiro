import type { MazeTemplate } from "./types";

export type Point = { x: number; y: number };

const LETTER_KEYS = ["a", "b", "c", "d", "e"] as const;
type LetterKey = (typeof LETTER_KEYS)[number];

export type SpawnedLetter = {
  key: LetterKey;      // a〜e
  index: number;       // 0〜4
  letter: string;      // 実際の文字（例：あ）
  pos: Point;          // 置く場所
};

export type SpawnPlan = {
  templateId: string;
  w: number;
  h: number;
  grid: string[];              // 元のASCII
  start: Point;
  goal: Point;
  letters: SpawnedLetter[];    // a〜eに割り当て済み
};

/**
 * テンプレからスポーン計画を作る
 * - S/G/a-e の座標を抽出
 * - template.letters を a→b→c→d→e に順番で割り当て
 */
export function planSpawns(template: MazeTemplate): SpawnPlan {
  ensureRectangular(template.grid);

  const h = template.grid.length;
  const w = template.grid[0].length;

  const start = findChar(template.grid, "S");
  const goal = findChar(template.grid, "G");
  if (!start) throw new Error(`planSpawns: start 'S' not found in ${template.id}`);
  if (!goal) throw new Error(`planSpawns: goal 'G' not found in ${template.id}`);

  const slots = findLetterSlots(template.grid);

  // 文字数は基本5想定（Lv1/Lv2の説明もそう）
  const letters = template.letters ?? [];
  if (letters.length === 0) {
    throw new Error(`planSpawns: template.letters is empty in ${template.id}`);
  }

  // a-e すべてがある前提で厳格にチェック（テンプレ不備を早期に炙り出す）
  if (letters.length > Object.keys(slots).length) {
    throw new Error(
      `planSpawns: not enough letter slots (need ${letters.length}, found ${Object.keys(slots).length}) in ${template.id}`
    );
  }

  const spawned: SpawnedLetter[] = [];
  for (let i = 0; i < letters.length; i++) {
    const key = LETTER_KEYS[i] ?? "a";
    const pos = slots[key];
    if (!pos) {
      throw new Error(`planSpawns: letter slot '${key}' not found in ${template.id}`);
    }
    spawned.push({ key, index: i, letter: letters[i], pos });
  }

  return {
    templateId: template.id,
    w,
    h,
    grid: template.grid,
    start,
    goal,
    letters: spawned,
  };
}

/**
 * a-e の位置を抽出して {a:Point, b:Point,...} を返す
 * - 同じキーが複数ある場合はエラー（テンプレミス）
 */
function findLetterSlots(grid: string[]) {
  const found: Partial<Record<LetterKey, Point>> = {};

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (isLetterKey(c)) {
        const k = c as LetterKey;
        if (found[k]) {
          throw new Error(`planSpawns: duplicate letter key '${k}' at (${x},${y})`);
        }
        found[k] = { x, y };
      }
    }
  }

  return found as Record<LetterKey, Point>;
}

function isLetterKey(c: string): c is LetterKey {
  return (LETTER_KEYS as readonly string[]).includes(c);
}

function findChar(grid: string[], ch: string): Point | null {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    const x = row.indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

function ensureRectangular(grid: string[]) {
  if (grid.length === 0) throw new Error("planSpawns: grid is empty");
  const w = grid[0].length;
  if (w === 0) throw new Error("planSpawns: grid has empty row");

  for (let y = 0; y < grid.length; y++) {
    if (grid[y].length !== w) {
      throw new Error(
        `planSpawns: grid is not rectangular at row ${y} (expected ${w}, got ${grid[y].length})`
      );
    }
  }
}
