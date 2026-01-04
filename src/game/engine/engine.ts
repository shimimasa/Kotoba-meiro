// engine.ts
import { createRenderer } from "../render/renderer";

export type Dir = "up" | "down" | "left" | "right";
export type Vec2 = { x: number; y: number };

export type GameResult = {
  level: number;
  timeSec: number;
  score: number;
  collected: number;
  total: number;
  hintEnabled: boolean;
};

export type EnemyState = {
  pos: Vec2;
  dir: Dir;
};

export type MazeState = {
  w: number;
  h: number;
  grid: string[]; // '#' wall, '.' pellet, ' ' empty
  tile: number;
  pellets: boolean[][];
  letters: { pos: Vec2; char: string; collected: boolean }[];
  goal: Vec2;
};

export type GameState = {
  running: boolean;
  hintEnabled: boolean;
  level: number;

  timeSec: number;
  score: number;

  // HUD向け
  totalLetters: number;
  collectedLetters: number;
  remainingLetters: number;
  nextChar: string;

  // entities
  maze: MazeState;
  player: { pos: Vec2; dir: Dir };
  enemy: EnemyState;
};

export type Engine = {
  update: (dtSec: number) => void;
  render: () => void;
  dispose: () => void;
  getState: () => GameState;
};

type CreateEngineOpts = {
  canvas: HTMLCanvasElement;
  hintEnabled: boolean;
  level: number;
  onExit?: () => void;
  onResult?: (result: GameResult) => void;
};

const DIRS: Record<Dir, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function inBounds(m: MazeState, x: number, y: number) {
  return x >= 0 && y >= 0 && x < m.w && y < m.h;
}
function isWall(m: MazeState, x: number, y: number) {
  if (!inBounds(m, x, y)) return true;
  return m.grid[y][x] === "#";
}
function canMove(m: MazeState, x: number, y: number) {
  return inBounds(m, x, y) && !isWall(m, x, y);
}

function makeLevel(level: number): {
  grid: string[];
  playerStart: Vec2;
  enemyStart: Vec2;
  goal: Vec2;
  letters: { pos: Vec2; char: string }[];
} {
  // ざっくり「口」のような迷路（あなたのスクショに近い雰囲気）
  // level によって少しだけ変える
  const base = [
    "#############",
    "#...#.....#.G#",
    "#.#.#.###.#..#",
    "#.#...#...#..#",
    "#.###.#.###..#",
    "#.....#......#",
    "#############",
  ];

  const base2 = [
    "#############",
    "#...#.....#..#",
    "#.#.#.###.#.G#",
    "#.#...#...#..#",
    "#.###.#.###..#",
    "#.....#......#",
    "#############",
  ];

  const grid = level === 2 ? base2 : base;

  const playerStart = { x: 1, y: 1 };
  const enemyStart = { x: 11, y: 5 };
  const goal = findChar(grid, "G") ?? { x: 11, y: 1 };

  // ひらがな（例）。本番はここを差し替えればOK
  const letters =
    level === 2
      ? [
          { pos: { x: 3, y: 1 }, char: "か" },
          { pos: { x: 7, y: 1 }, char: "き" },
          { pos: { x: 5, y: 3 }, char: "く" },
          { pos: { x: 3, y: 5 }, char: "け" },
          { pos: { x: 7, y: 5 }, char: "こ" },
        ]
      : [
          { pos: { x: 6, y: 1 }, char: "あ" },
          { pos: { x: 5, y: 3 }, char: "い" },
          { pos: { x: 7, y: 3 }, char: "う" },
          { pos: { x: 5, y: 5 }, char: "え" },
          { pos: { x: 7, y: 5 }, char: "お" },
        ];

  return { grid, playerStart, enemyStart, goal, letters };
}

function findChar(grid: string[], ch: string): Vec2 | null {
  for (let y = 0; y < grid.length; y++) {
    const x = grid[y].indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

function buildMaze(level: number): {
  maze: MazeState;
  playerStart: Vec2;
  enemyStart: Vec2;
} {
  const { grid, playerStart, enemyStart, goal, letters } = makeLevel(level);

  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const tile = 48;

  const pellets: boolean[][] = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) => grid[y][x] === ".")
  );

  const maze: MazeState = {
    w,
    h,
    grid: grid.map((row) => row.replace(/G/g, " ")), // Gは別管理
    tile,
    pellets,
    letters: letters.map((l) => ({ ...l, collected: false })),
    goal,
  };

  return { maze, playerStart, enemyStart };
}

function opposite(d: Dir): Dir {
  if (d === "up") return "down";
  if (d === "down") return "up";
  if (d === "left") return "right";
  return "left";
}

function chooseEnemyDir(m: MazeState, enemy: EnemyState): Dir {
  // “追跡なし”：前進できるなら前進優先、ダメなら曲がる
  const cur = enemy.dir;
  const options = ["up", "down", "left", "right"].filter((d) => {
    const v = DIRS[d as Dir];
    const nx = enemy.pos.x + v.x;
    const ny = enemy.pos.y + v.y;
    if (!canMove(m, nx, ny)) return false;
    // なるべくUターンしない
    if (d === opposite(cur)) return false;
    return true;
  });

  if (options.length > 0) {
    // たまに曲がる（見た目の変化用）
    if (Math.random() < 0.25) {
      const randomDir = options[(Math.random() * options.length) | 0] as Dir;
      return randomDir;
    }
    // 前進できるなら前進
    const vcur = DIRS[cur];
    if (canMove(m, enemy.pos.x + vcur.x, enemy.pos.y + vcur.y)) return cur;
    const randomDir = options[(Math.random() * options.length) | 0] as Dir;
    return randomDir;
  }

  // Uターンしか無い場合
  const back = opposite(cur);
  const v = DIRS[back];
  if (canMove(m, enemy.pos.x + v.x, enemy.pos.y + v.y)) return back;

  return cur;
}

function updateHud(state: GameState) {
  const total = state.maze.letters.length;
  const collected = state.maze.letters.filter((l) => l.collected).length;
  state.totalLetters = total;
  state.collectedLetters = collected;
  state.remainingLetters = Math.max(0, total - collected);

  // 次に取るべき文字
  const next = state.maze.letters.find((l) => !l.collected);
  state.nextChar = next ? next.char : "-";
}

function tryCollect(state: GameState) {
  const { maze, player } = state;

  // pellet
  if (maze.pellets[player.pos.y]?.[player.pos.x]) {
    maze.pellets[player.pos.y][player.pos.x] = false;
    state.score += 1;
  }

  // letters
  for (const l of maze.letters) {
    if (!l.collected && l.pos.x === player.pos.x && l.pos.y === player.pos.y) {
      l.collected = true;
      state.score += 5;
      break;
    }
  }
}

function isClear(state: GameState) {
  const allCollected = state.maze.letters.every((l) => l.collected);
  const onGoal = state.player.pos.x === state.maze.goal.x && state.player.pos.y === state.maze.goal.y;
  return allCollected && onGoal;
}

export function createEngine(opts: CreateEngineOpts): Engine {
  const { maze, playerStart, enemyStart } = buildMaze(opts.level);

  const state: GameState = {
    running: true,
    hintEnabled: !!opts.hintEnabled,
    level: opts.level,

    timeSec: 0,
    score: 0,

    totalLetters: 0,
    collectedLetters: 0,
    remainingLetters: 0,
    nextChar: "-",

    maze,
    player: { pos: { ...playerStart }, dir: "right" },
    enemy: { pos: { ...enemyStart }, dir: "left" },
  };

  updateHud(state);

  const renderer = createRenderer(opts.canvas, state as any);

  // --- input ---
  let pendingDir: Dir | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!state.running) return;
    const key = e.key;
    if (key === "ArrowUp") pendingDir = "up";
    else if (key === "ArrowDown") pendingDir = "down";
    else if (key === "ArrowLeft") pendingDir = "left";
    else if (key === "ArrowRight") pendingDir = "right";
  };

  window.addEventListener("keydown", onKeyDown);

  // --- fixed tick ---
  const fixedStep = 1 / 12; // 12 ticks per sec（グリッド移動向け）
  let acc = 0;

  function stepOnce() {
    // player move
    if (pendingDir) state.player.dir = pendingDir;

    const d = DIRS[state.player.dir];
    const nx = state.player.pos.x + d.x;
    const ny = state.player.pos.y + d.y;
    if (canMove(state.maze, nx, ny)) {
      state.player.pos.x = nx;
      state.player.pos.y = ny;
      tryCollect(state);
      updateHud(state);
    }

    // enemy move (追跡なし、曲がるだけ)
    state.enemy.dir = chooseEnemyDir(state.maze, state.enemy);
    const ed = DIRS[state.enemy.dir];
    const ex = state.enemy.pos.x + ed.x;
    const ey = state.enemy.pos.y + ed.y;
    if (canMove(state.maze, ex, ey)) {
      state.enemy.pos.x = ex;
      state.enemy.pos.y = ey;
    }

    // hit check（当たったら即終了：仮）
    if (
      state.enemy.pos.x === state.player.pos.x &&
      state.enemy.pos.y === state.player.pos.y
    ) {
      state.running = false;
      opts.onExit?.(); // とりあえず start に戻すなど運用に合わせて
      return;
    }

    // clear
    if (isClear(state)) {
      state.running = false;
      const result: GameResult = {
        level: state.level,
        timeSec: Math.floor(state.timeSec),
        score: state.score,
        collected: state.collectedLetters,
        total: state.totalLetters,
        hintEnabled: state.hintEnabled,
      };
      opts.onResult?.(result);
    }
  }

  function update(dtSec: number) {
    if (!state.running) return;
    state.timeSec += dtSec;

    acc += dtSec;
    while (acc >= fixedStep) {
      stepOnce();
      acc -= fixedStep;
      if (!state.running) break;
    }
  }

  function render() {
    renderer.render();
  }

  function dispose() {
    window.removeEventListener("keydown", onKeyDown);
    renderer.dispose?.();
  }

  return { update, render, dispose, getState: () => state };
}
