import type { MazeTemplate } from "./types";

export type Point = { x: number; y: number };

export type AnalyzedTemplate = {
  templateId: string;
  w: number;
  h: number;

  /** 元のASCII */
  grid: string[];

  /** 通行可能か（. / S / G / a-e） */
  walkable: boolean[][];

  /** start / goal */
  start: Point;
  goal: Point;

  /**
   * 文字アイテム（順序固定）
   * index: 0..4
   * char: 実際に表示する文字（ひらがな等）
   */
  letters: Array<Point & { index: number; char: string }>;

  /** junction（分岐点）: 通行可能な隣接が3以上 */
  junctions: Point[];

  /** startからの距離（歩数）。到達不可は Infinity */
  distFromStart: number[][];

  /** near / mid / far の閾値（spawnPlanner用） */
  thresholds: { nearMax: number; midMax: number };
};

const LETTER_KEYS = ["a", "b", "c", "d", "e"] as const;

function isLetterKey(c: string): c is (typeof LETTER_KEYS)[number] {
  return (LETTER_KEYS as readonly string[]).includes(c);
}

function isWalkableChar(c: string) {
  return c === "." || c === "S" || c === "G" || isLetterKey(c);
}

function ensureRectangular(grid: string[]) {
  if (grid.length === 0) throw new Error("template.grid is empty");
  const w = grid[0].length;
  if (w === 0) throw new Error("template.grid has empty row");

  for (let y = 0; y < grid.length; y++) {
    if (grid[y].length !== w) {
      throw new Error(`template.grid is not rectangular at row ${y}`);
    }
  }
  return w;
}

function neighbors4(x: number, y: number): Point[] {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];
}

export function analyzeTemplate(template: MazeTemplate): AnalyzedTemplate {
  const w = ensureRectangular(template.grid);
  const h = template.grid.length;

  if (!template.letters || template.letters.length !== 5) {
    throw new Error(`template.letters must be length 5 (got ${template.letters?.length ?? 0})`);
  }

  const walkable: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  const distFromStart: number[][] = Array.from({ length: h }, () => Array(w).fill(Infinity));

  let start: Point | null = null;
  let goal: Point | null = null;

  // placeholder位置収集（a-e）
  const letterPosByIndex: Array<Point | null> = [null, null, null, null, null];

  for (let y = 0; y < h; y++) {
    const row = template.grid[y];
    for (let x = 0; x < w; x++) {
      const c = row[x];
      walkable[y][x] = isWalkableChar(c);

      if (c === "S") start = { x, y };
      if (c === "G") goal = { x, y };

      if (isLetterKey(c)) {
        const idx = c.charCodeAt(0) - "a".charCodeAt(0);
        if (idx < 0 || idx > 4) continue;
        if (letterPosByIndex[idx]) {
          throw new Error(`duplicate letter key '${c}' at (${x},${y}) in template ${template.id}`);
        }
        letterPosByIndex[idx] = { x, y };
      }
    }
  }

  if (!start) throw new Error(`missing 'S' in template ${template.id}`);
  if (!goal) throw new Error(`missing 'G' in template ${template.id}`);

  // lettersを確定（a→letters[0] ... e→letters[4]）
  const letters = letterPosByIndex.map((p, index) => {
    if (!p) {
      throw new Error(`missing letter key '${String.fromCharCode(97 + index)}' in template ${template.id}`);
    }
    return { ...p, index, char: template.letters[index] };
  });

  // BFS（startからの距離）
  const q: Point[] = [];
  distFromStart[start.y][start.x] = 0;
  q.push(start);

  while (q.length) {
    const cur = q.shift()!;
    const d = distFromStart[cur.y][cur.x];

    for (const nb of neighbors4(cur.x, cur.y)) {
      if (nb.x < 0 || nb.y < 0 || nb.x >= w || nb.y >= h) continue;
      if (!walkable[nb.y][nb.x]) continue;
      if (distFromStart[nb.y][nb.x] <= d + 1) continue;

      distFromStart[nb.y][nb.x] = d + 1;
      q.push(nb);
    }
  }

  // junction抽出（隣接通路が3以上）
  const junctions: Point[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!walkable[y][x]) continue;
      let count = 0;
      for (const nb of neighbors4(x, y)) {
        if (nb.x < 0 || nb.y < 0 || nb.x >= w || nb.y >= h) continue;
        if (walkable[nb.y][nb.x]) count++;
      }
      if (count >= 3) junctions.push({ x, y });
    }
  }

  // near/mid/far 閾値：歩行可能セルの距離分布の 33% / 66% あたり
  const distances: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = distFromStart[y][x];
      if (Number.isFinite(d)) distances.push(d);
    }
  }
  distances.sort((a, b) => a - b);
  const p33 = distances[Math.floor(distances.length * 0.33)] ?? 0;
  const p66 = distances[Math.floor(distances.length * 0.66)] ?? p33;

  return {
    templateId: template.id,
    w,
    h,
    grid: template.grid,
    walkable,
    start,
    goal,
    letters,
    junctions,
    distFromStart,
    thresholds: {
      nearMax: p33,
      midMax: p66,
    },
  };
}
