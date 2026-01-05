import { createRenderer } from "../render/renderer";
import type {
  Engine,
  EngineOptions,
  GameResult,
  GameState,
  MazeState,
  Direction,
} from "./state";
import { createSfx } from "../audio/sfx";

const DIRS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeGrid(grid: string[]): string[] {
  const w = Math.max(1, ...grid.map((r) => r.length));
  return grid.map((r) => r.padEnd(w, "#"));
}

function buildWalkable(grid: string[]): boolean[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const walkable: boolean[][] = Array.from({ length: h }, () =>
    Array(w).fill(false),
  );
  for (let y = 0; y < h; y++) {
    const row = grid[y] ?? "";
    for (let x = 0; x < w; x++) {
      const c = row[x] ?? "#";
      walkable[y][x] = c !== "#";
    }
  }
  return walkable;
}

function findChar(grid: string[], ch: string): { x: number; y: number } | null {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y] ?? "";
    const x = row.indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

function replaceChar(grid: string[], from: string, to: string): string[] {
  return grid.map((row) => row.split(from).join(to));
}

// --- Maze templates ---
// Lv1/Lv2は「密度・幅感」だけ変える（後でlv1.ts/lv2.tsに差し替えてもOK）
const MAZE_TEMPLATES: Record<number, string[][]> = {
  1: [
    normalizeGrid([
      "############",
      "#S....#....#",
      "#.##..#..##.#",
      "#....a#b....#",
      "####..#..####",
      "#....c#d....#",
      "#.##..#..##.#",
      "#....#....G.#",
      "############",
    ]),
    normalizeGrid([
      "############",
      "#S....#....#",
      "#.##..#..##.#",
      "#....a#.....#",
      "####..#.#####",
      "#....b#c....#",
      "#.##..#..##.#",
      "#..d..#..G.e#",
      "############",
    ]),
  ],
  2: [
    normalizeGrid([
      "###############",
      "#S.....#......#",
      "#.###..#..###..#",
      "#..a...#...b...#",
      "###.#######.####",
      "#.....c...#....#",
      "#.#####.#.#.##.#",
      "#..d....#....G.#",
      "#.#####.#.#####.#",
      "#....e..#.......#",
      "###############",
    ]),
    normalizeGrid([
      "###############",
      "#S......#.....#",
      "#.###.###.###.#",
      "#..a..#....b..#",
      "###.#.#.#####.#",
      "#...#.#..c....#",
      "#.###.#####.###",
      "#..d.....#...G#",
      "#.#####.#.###.#",
      "#....e..#.....#",
      "###############",
    ]),
  ],
};

function makeMaze(level: number, hintEnabled: boolean): MazeState {
  const grids = MAZE_TEMPLATES[level] ?? MAZE_TEMPLATES[1];
  const grid0 = pick(grids);
  const h = grid0.length;
  const w = grid0[0]?.length ?? 1;

  const start = findChar(grid0, "S") ?? { x: 1, y: 1 };
  const goal = findChar(grid0, "G") ?? { x: w - 2, y: h - 2 };

  // letters placeholders a-e -> hiragana
  const kanaSets: string[][] = [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["ら", "り", "る", "れ", "ろ"],
  ];
  const lettersKana =
    level >= 2 ? pick(kanaSets.filter((s) => s.length === 5)) : kanaSets[0];

  const letters: MazeState["letters"] = [];
  const slots = ["a", "b", "c", "d", "e"] as const;
  for (let i = 0; i < slots.length; i++) {
    const pos = findChar(grid0, slots[i]);
    if (!pos) continue;
    letters.push({ x: pos.x, y: pos.y, ch: lettersKana[i], collected: false });
  }

  // Sは通路化（.`), Gは残す（rendererがG表示する）
  const grid = replaceChar(grid0, "S", ".");
  const walkable = buildWalkable(grid);

  // pellets: '.' のみ置く（letters/開始/ゴールは除外）
  const pellets: Array<{ x: number; y: number; eaten: boolean }> = [];
  const isLetterCell = (x: number, y: number) =>
    letters.some((l) => l.x === x && l.y === y);

  for (let y = 0; y < h; y++) {
    const row = grid[y] ?? "";
    for (let x = 0; x < w; x++) {
      if (!walkable[y]?.[x]) continue;
      const c = row[x] ?? "#";
      if (c !== ".") continue;
      if (
        (x === start.x && y === start.y) ||
        (x === goal.x && y === goal.y) ||
        isLetterCell(x, y)
      )
        continue;
      pellets.push({ x, y, eaten: false });
    }
  }

  return {
    w,
    h,
    grid,
    walkable,
    letters,
    start,
    goal,
    player: { x: start.x, y: start.y, dir: "right" },
    pellets,
    nextIndex: 0,
    score: 0,
    time: 0,
    finished: false,
    flash: 0,
    mouthOpen: false,
    mouthTimer: 0,
    lastEat: 0,
    hintEnabled,
    enemies: [], // 今は空でOK
  };
}

export type { GameResult } from "./state";

export function createEngine(opts: EngineOptions): Engine {
  const sfx = createSfx();

  const state: GameState = {
    hintEnabled: opts.hintEnabled ?? true,
    running: true,
    level: opts.level ?? 1,
    maze: undefined,
    result: null,
  };

  state.maze = makeMaze(state.level, state.hintEnabled);

  const renderer = createRenderer(opts.canvas, state);

  // tick: 方向入力が来たら、固定間隔で1マスずつ進む
  const STEP_SEC = 0.12;
  let acc = 0;

  const pelletTotal = state.maze.pellets.length;

  function pelletAt(x: number, y: number) {
    return state.maze!.pellets.find((p) => p.x === x && p.y === y) ?? null;
  }

  function tryEatPellet() {
    const m = state.maze!;
    const p = pelletAt(m.player.x, m.player.y);
    if (p && !p.eaten) {
      p.eaten = true;
      m.score += 1;
      m.lastEat = 0.15;
      sfx.pellet();
    }
  }

  function tryCollectLetter() {
    const m = state.maze!;
    const target = m.letters[m.nextIndex];
    if (!target) return;
    if (
      m.player.x === target.x &&
      m.player.y === target.y &&
      !target.collected
    ) {
      target.collected = true;
      m.nextIndex = clamp(m.nextIndex + 1, 0, m.letters.length);
      m.lastEat = 0.2;
      sfx.kana();
    }
  }

  function checkFinish() {
    const m = state.maze!;
    if (m.finished) return;

    const allLetters = m.letters.length
      ? m.letters.every((l) => l.collected)
      : true;

    if (allLetters && m.player.x === m.goal.x && m.player.y === m.goal.y) {
      m.finished = true;
      m.flash = 0.9;
      sfx.clear();

      const pelletsEaten = m.pellets.reduce((n, p) => n + (p.eaten ? 1 : 0), 0);

      const result: GameResult = {
        ok: true,
        time: m.time,
        score: m.score,
        pelletsEaten,
        pelletsTotal: pelletTotal,
        level: state.level,
      };
      state.result = result;
      opts.onResult?.(result);
    }
  }

  function canMoveTo(x: number, y: number) {
    const m = state.maze!;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
    return !!m.walkable[y]?.[x];
  }

  function stepMove(dir: Direction) {
    const m = state.maze!;
    const { dx, dy } = DIRS[dir];
    const nx = m.player.x + dx;
    const ny = m.player.y + dy;

    if (canMoveTo(nx, ny)) {
      m.player.x = nx;
      m.player.y = ny;
      m.player.dir = dir;

      tryEatPellet();
      tryCollectLetter();
      checkFinish();
    } else {
      // 壁でも向きだけ更新（見た目の方向）
      m.player.dir = dir;
    }
  }

  let pendingDir: Direction | null = null;

  return {
    getState() {
      return state;
    },

    setInput(dir: Direction | null) {
      pendingDir = dir;
    },

    update(dt: number) {
      const m = state.maze!;
      if (!state.running) return;

      // time
      m.time += dt;
      m.mouthTimer += dt;
      if (m.lastEat > 0) m.lastEat = Math.max(0, m.lastEat - dt);
      if (m.flash > 0) m.flash = Math.max(0, m.flash - dt);

      // simple mouth animation
      if (m.mouthTimer >= 0.12) {
        m.mouthTimer = 0;
        m.mouthOpen = !m.mouthOpen;
      }

      if (m.finished) return;

      acc += dt;
      while (acc >= STEP_SEC) {
        acc -= STEP_SEC;
        if (pendingDir) stepMove(pendingDir);
      }
    },

    render() {
      renderer.render();
    },

    dispose() {
      sfx.init();
    },

    reset(level?: number) {
      state.level = level ?? state.level;
      state.maze = makeMaze(state.level, state.hintEnabled);
      state.result = null;
      acc = 0;
    },

    setHintEnabled(on: boolean) {
      state.hintEnabled = on;
      if (state.maze) state.maze.hintEnabled = on;
    },
  };
}
