import type { MazeTemplate } from "./types";

export type Point = { x: number; y: number };

export type AnalyzedTemplate = {
  templateId: string;
  w: number;
  h: number;
  grid: string[];
  walkable: boolean[][];
  start: Point;
  goal: Point;
  letterSlots: Array<Point & { index: number; char: string }>;
  distFromStart: number[][];
  thresholds: { nearMax: number; midMax: number };
};

const LETTER_KEYS = ["a", "b", "c", "d", "e"] as const;

export function analyzeTemplate(t: MazeTemplate): AnalyzedTemplate {
  ensureRectangular(t.grid);

  const h = t.grid.length;
  const w = t.grid[0].length;

  const walkable: boolean[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  let start: Point | null = null;
  let goal: Point | null = null;

  const letterSlotsMap = new Map<string, Point>();

  for (let y = 0; y < h; y++) {
    const row = t.grid[y];
    for (let x = 0; x < w; x++) {
      const c = row[x];
      const isWalk = c === "." || c === "S" || c === "G" || isLetterKey(c);
      walkable[y][x] = isWalk;

      if (c === "S") start = { x, y };
      if (c === "G") goal = { x, y };
      if (isLetterKey(c)) {
        if (letterSlotsMap.has(c)) throw new Error(`analyzeTemplate: duplicate letter slot '${c}' in ${t.id}`);
        letterSlotsMap.set(c, { x, y });
      }
    }
  }

  if (!start) throw new Error(`analyzeTemplate: start 'S' not found in ${t.id}`);
  if (!goal) throw new Error(`analyzeTemplate: goal 'G' not found in ${t.id}`);

  const letterSlots: Array<Point & { index: number; char: string }> = [];
  for (let i = 0; i < LETTER_KEYS.length; i++) {
    const k = LETTER_KEYS[i];
    const p = letterSlotsMap.get(k);
    if (p) letterSlots.push({ ...p, index: i, char: k });
  }

  const distFromStart = bfsDistances(walkable, w, h, start);

  const ds: number[] = [];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const d = distFromStart[yy][xx];
    if (Number.isFinite(d)) ds.push(d);
  }
  ds.sort((a, b) => a - b);
  const nearMax = ds.length ? ds[Math.floor(ds.length * 0.33)] : 0;
  const midMax = ds.length ? ds[Math.floor(ds.length * 0.66)] : nearMax;

  return {
    templateId: t.id,
    w,
    h,
    grid: t.grid,
    walkable,
    start,
    goal,
    letterSlots,
    distFromStart,
    thresholds: { nearMax, midMax },
  };
}

function isLetterKey(c: string): c is (typeof LETTER_KEYS)[number] {
  return (LETTER_KEYS as readonly string[]).includes(c);
}

function ensureRectangular(grid: string[]) {
  if (grid.length === 0) throw new Error("analyzeTemplate: grid is empty");
  const w = grid[0].length;
  if (w === 0) throw new Error("analyzeTemplate: grid has empty row");
  for (let y = 0; y < grid.length; y++) {
    if (grid[y].length !== w) {
      throw new Error(`analyzeTemplate: grid is not rectangular at row ${y} (expected ${w}, got ${grid[y].length})`);
    }
  }
}

function bfsDistances(walkable: boolean[][], w: number, h: number, start: Point): number[][] {
  const dist: number[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => Infinity));
  const q: Point[] = [];
  dist[start.y][start.x] = 0;
  q.push(start);

  let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    const cd = dist[cur.y][cur.x];

    const nbs = [
      { x: cur.x + 1, y: cur.y },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x, y: cur.y - 1 },
    ];

    for (const n of nbs) {
      if (n.x < 0 || n.y < 0 || n.x >= w || n.y >= h) continue;
      if (!walkable[n.y][n.x]) continue;
      if (dist[n.y][n.x] <= cd + 1) continue;
      dist[n.y][n.x] = cd + 1;
      q.push(n);
    }
  }

  return dist;
}
