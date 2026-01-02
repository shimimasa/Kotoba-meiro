import type { GameState } from "./state";
import { createRenderer } from "../render/renderer";

import { analyzeTemplate } from "../maze/analyzeTemplate";
import { planSpawns } from "../maze/spawnPlanner";
import { buildRoute } from "../maze/path";
import { lv1Templates } from "../maze/templates/lv1";

import { createSfx } from "../audio/sfx";


export type GameResult = {
  timeSec: number;
  score: number;
  pelletsEaten: number;
  pelletsTotal: number;
  lettersCollected: number;
  lettersTotal: number;
  hintEnabled: boolean;
};



// ---- 追加の内部型（GameStateは最小でもOK。拡張して使う） ----
type Dir = "up" | "down" | "left" | "right";

type MazeState = {
  w: number;
  h: number;
  grid: string[]; // 1行=文字列
  walkable: boolean[][];
  start: { x: number; y: number };
  goal: { x: number; y: number };

  letters: Array<{ key: string; index: number; letter: string; pos: { x: number; y: number } }>;
  nextLetterIndex: number;

  // ヒント用（任意）
  route?: { path: Array<{ x: number; y: number }>; length: number };

  // プレイヤー
  player: { x: number; y: number; dir: Dir };

  // ペレット
  pellets: boolean[][];
  score: number;

  // 食べた瞬間のフラッシュ演出
  lastEat?: { x: number; y: number; t: number };

  // 口パク（rendererが参照する想定）
  mouthOpen?: boolean;
};

export type Engine = {
  update: (dt: number) => void;
  render: () => void;
  dispose: () => void;
};

export function createEngine(opts: {
  canvas: HTMLCanvasElement;
  hintEnabled: boolean;
  onResult?: (result: GameResult) => void;
  onExit?: () => void;
}): Engine {
  // GameState は最小定義でもOK。交差型で拡張して持つ
  const state: (GameState & { maze?: MazeState }) = {
    hintEnabled: opts.hintEnabled,
    running: true,
  };

  // renderer（stateは参照で渡す）
  const renderer: any = createRenderer(opts.canvas, state as any);

  // SFX（AudioContext版想定：init/unlock/pellet/kana/clear）
  const sfx = createSfx();
  // 非同期ロード開始（await不要。ロード完了後から鳴る）
  try {
    void (sfx as any).init?.();
  } catch {
    // ignore
  }

  // ---- 迷路初期化 ----
  const template = lv1Templates[0];
  const analyzed = analyzeTemplate(template); // { w,h,grid,walkable,start,goal }
  const plan = planSpawns(template); // letters: [{char,pos},...]

  const checkpoints = plan.letters.map((l) => l.pos);
  const routeRes = buildRoute(analyzed.walkable, analyzed.start, checkpoints, analyzed.goal);

  // pellets: '.' のみに置く（S/G/文字には置かない）
  const pellets: boolean[][] = Array.from({ length: analyzed.h }, () =>
    Array.from({ length: analyzed.w }, () => false)
  );
  for (let y = 0; y < analyzed.h; y++) {
    const row = analyzed.grid[y];
    for (let x = 0; x < analyzed.w; x++) {
      const c = row[x];
      if (c === ".") pellets[y][x] = true;
    }
  }

  state.maze = {
    w: analyzed.w,
    h: analyzed.h,
    grid: analyzed.grid,
    walkable: analyzed.walkable,
    start: analyzed.start,
    goal: analyzed.goal,
    letters: plan.letters.map((l) => ({ key: l.key, index: l.index, letter: l.letter, pos: l.pos })),
    nextLetterIndex: 0,
    route: routeRes?.ok ? { path: routeRes.path, length: routeRes.length } : undefined,
    player: { x: analyzed.start.x, y: analyzed.start.y, dir: "right" },
    pellets,
    score: 0,
  };

  // ===== 追加：結果計算用 =====
  let elapsedSec = 0;
  const pelletsTotal = state.maze.pellets.reduce(
    (acc, row) => acc + row.filter(Boolean).length,
    0
  );

  // ---- 入力（矢印 / WASD） ----
  let movedThisFrame = false;
  let mouthTimer = 0;
  let mouthOpen = false;
  let unlockedOnce = false;

  const dirFromKey = (key: string): Dir | null => {
    switch (key) {
      case "ArrowUp":
      case "w":
      case "W":
        return "up";
      case "ArrowDown":
      case "s":
      case "S":
        return "down";
      case "ArrowLeft":
      case "a":
      case "A":
        return "left";
      case "ArrowRight":
      case "d":
      case "D":
        return "right";
      default:
        return null;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!state.running || !state.maze) return;

    const d = dirFromKey(e.key);
    if (!d) return;

    // スクロール抑止
    e.preventDefault();

    // ★重要：ユーザー操作と同一イベント内で unlock
    if (!unlockedOnce) {
      unlockedOnce = true;
      try {
        (sfx as any).unlock?.();
      } catch {
        // ignore
      }
    } else {
      // 2回目以降も念のため
      try {
        (sfx as any).unlock?.();
      } catch {}
    }

    const m = state.maze;
    m.player.dir = d;

    const dx = d === "left" ? -1 : d === "right" ? 1 : 0;
    const dy = d === "up" ? -1 : d === "down" ? 1 : 0;

    const nx = m.player.x + dx;
    const ny = m.player.y + dy;

    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) return;
    if (!m.walkable[ny][nx]) return;

    m.player.x = nx;
    m.player.y = ny;

    movedThisFrame = true;

    // ペレットを食べる
    if (m.pellets[ny]?.[nx]) {
      m.pellets[ny][nx] = false;
      m.score += 1;
      m.lastEat = { x: nx, y: ny, t: 0 };
      try {
        (sfx as any).pellet?.();
      } catch {}
    }

    // 文字取得判定
    const next = m.letters[m.nextLetterIndex];
    if (next && next.pos.x === nx && next.pos.y === ny) {
      m.nextLetterIndex += 1;
      try {
        (sfx as any).kana?.();
      } catch {}
    }

    // クリア判定（すべての文字を取った後にGへ）
    if (m.nextLetterIndex >= m.letters.length) {
      if (m.goal.x === nx && m.goal.y === ny) {
        state.running = false;

    try {
      (sfx as any).clear?.();
    } catch {}

    // 残りペレット数
    const pelletsLeft = m.pellets.reduce(
      (acc, row) => acc + row.filter(Boolean).length,
      0
    );

    const result = {
      timeSec: Math.round(elapsedSec),
      score: m.score ?? 0,
      pelletsEaten: pelletsTotal - pelletsLeft,
      pelletsTotal,
      lettersCollected: m.nextLetterIndex,
      lettersTotal: m.letters.length,
      hintEnabled: state.hintEnabled,
    };

    // ResultScreen がある場合はこちら
    if (opts.onResult) {
      opts.onResult(result);
    } else {
      opts.onExit?.();
    }
      }
    }
  };

  window.addEventListener("keydown", onKeyDown, { passive: false });

  // ---- リサイズ ----
  const handleResize = () => {
    if (typeof renderer.resize === "function") renderer.resize();
    else if (typeof renderer.onResize === "function") renderer.onResize();
    else if (typeof renderer.resizeToDisplaySize === "function") renderer.resizeToDisplaySize();
  };
  window.addEventListener("resize", handleResize);
  handleResize();

  return {
    update(dt: number) {
      if (!state.running) return;
      const m = state.maze;
      if (!m) return;

      // 経過時間（秒）
      elapsedSec += dt;
      // 口パク（動いたら0.15秒だけ開く）
      if (movedThisFrame) {
        mouthTimer = 0.15;
        movedThisFrame = false;
      }
      if (mouthTimer > 0) {
        mouthTimer -= dt;
        mouthOpen = true;
      } else {
        mouthOpen = false;
      }
      m.mouthOpen = mouthOpen;

      // フラッシュ演出（0.2秒）
      if (m.lastEat) {
        m.lastEat.t += dt;
        if (m.lastEat.t >= 0.2) m.lastEat = undefined;
      }

      if (typeof renderer.update === "function") renderer.update(dt);
    },

    render() {
      if (!state.running) return;
      if (typeof renderer.render === "function") renderer.render();
    },

    dispose() {
      state.running = false;
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("resize", handleResize);
      if (typeof renderer.dispose === "function") renderer.dispose();
    },
  };
}
