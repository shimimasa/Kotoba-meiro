// src/game/maze/spawnPlanner.ts
/**
 * Spawn planner:
 * - Given a maze (walkable / wall), decide spawn positions for:
 *   - player
 *   - enemies
 *   - targets (e.g., kana letters in order)
 *
 * Design goals:
 * - No engine dependencies (pure functions)
 * - Works with any maze representation via MazeLike adapter
 * - Deterministic with seed (optional)
 */

export type Vec2 = Readonly<{ x: number; y: number }>;

export interface MazeLike {
  width: number;
  height: number;
  /** true if (x,y) is a wall / blocked */
  isWall(x: number, y: number): boolean;
}

/** Optional marker support (if your maze parser has special tiles) */
export interface SpawnMarkers {
  player?: Vec2;
  enemies?: Vec2[];
  targets?: Vec2[];
}

export interface SpawnPlan {
  player: Vec2;
  enemies: Vec2[];
  targets: Vec2[];
}

export interface SpawnPlanOptions {
  enemyCount: number;
  targetCount: number;

  /** Minimum manhattan distance constraints */
  minEnemyToPlayerDist?: number; // default 8
  minEnemyToEnemyDist?: number; // default 6
  minTargetToPlayerDist?: number; // default 4
  minTargetToTargetDist?: number; // default 3

  /** Prefer deterministic randomness */
  seed?: number;

  /** If you already have markers from the maze file, use them first */
  markers?: SpawnMarkers;

  /**
   * If true, planner tries to spread targets evenly across the maze using "farthest sampling".
   * If false, targets are random (with constraints).
   */
  spreadTargets?: boolean; // default true
}

/** Main entry */
export function planSpawns(maze: MazeLike, opts: SpawnPlanOptions): SpawnPlan {
  const rng = createRng(opts.seed ?? Date.now());

  const walkables = collectWalkables(maze);
  if (walkables.length === 0) {
    throw new Error("spawnPlanner: no walkable cells found in maze");
  }

  // ---- 1) Player spawn
  const player =
    opts.markers?.player ??
    pickPlayerSpawn(maze, walkables, rng);

  // ---- 2) Enemy spawns
  const enemyCount = Math.max(0, Math.floor(opts.enemyCount));
  const enemiesFromMarker = (opts.markers?.enemies ?? []).slice(0, enemyCount);
  const enemiesNeeded = enemyCount - enemiesFromMarker.length;

  const enemiesAuto =
    enemiesNeeded > 0
      ? pickEnemySpawns(maze, walkables, player, enemiesNeeded, rng, {
          minEnemyToPlayerDist: opts.minEnemyToPlayerDist ?? 8,
          minEnemyToEnemyDist: opts.minEnemyToEnemyDist ?? 6,
        })
      : [];

  const enemies = [...enemiesFromMarker, ...enemiesAuto];

  // ---- 3) Target spawns (kana letters etc.)
  const targetCount = Math.max(0, Math.floor(opts.targetCount));
  const targetsFromMarker = (opts.markers?.targets ?? []).slice(0, targetCount);
  const targetsNeeded = targetCount - targetsFromMarker.length;

  const targetsAuto =
    targetsNeeded > 0
      ? pickTargetSpawns(maze, walkables, player, targetsNeeded, rng, {
          minTargetToPlayerDist: opts.minTargetToPlayerDist ?? 4,
          minTargetToTargetDist: opts.minTargetToTargetDist ?? 3,
          spreadTargets: opts.spreadTargets ?? true,
        })
      : [];

  const targets = [...targetsFromMarker, ...targetsAuto];

  // Final validation: ensure in-bounds & not wall
  assertValid(maze, player, "player");
  enemies.forEach((p, i) => assertValid(maze, p, `enemy[${i}]`));
  targets.forEach((p, i) => assertValid(maze, p, `target[${i}]`));

  return { player, enemies, targets };
}

/* ------------------------------ helpers ------------------------------ */

function assertValid(maze: MazeLike, p: Vec2, label: string) {
  if (p.x < 0 || p.y < 0 || p.x >= maze.width || p.y >= maze.height) {
    throw new Error(`spawnPlanner: ${label} out of bounds: (${p.x},${p.y})`);
  }
  if (maze.isWall(p.x, p.y)) {
    throw new Error(`spawnPlanner: ${label} is on wall: (${p.x},${p.y})`);
  }
}

function collectWalkables(maze: MazeLike): Vec2[] {
  const out: Vec2[] = [];
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!maze.isWall(x, y)) out.push({ x, y });
    }
  }
  return out;
}

/**
 * Player spawn policy:
 * - Prefer a walkable near the center
 * - If center is wall, pick the nearest walkable to center
 */
function pickPlayerSpawn(maze: MazeLike, walkables: Vec2[], rng: () => number): Vec2 {
  const cx = (maze.width - 1) / 2;
  const cy = (maze.height - 1) / 2;

  // If exact center-ish is walkable, use it
  const centerCandidates: Vec2[] = [
    { x: Math.floor(cx), y: Math.floor(cy) },
    { x: Math.ceil(cx), y: Math.floor(cy) },
    { x: Math.floor(cx), y: Math.ceil(cy) },
    { x: Math.ceil(cx), y: Math.ceil(cy) },
  ];
  for (const c of centerCandidates) {
    if (!maze.isWall(c.x, c.y)) return c;
  }

  // Otherwise choose nearest walkable to center; if tie, random among ties
  let bestDist = Infinity;
  let best: Vec2[] = [];
  for (const p of walkables) {
    const d = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = [p];
    } else if (d === bestDist) {
      best.push(p);
    }
  }
  return best[Math.floor(rng() * best.length)] ?? walkables[0];
}

function pickEnemySpawns(
  maze: MazeLike,
  walkables: Vec2[],
  player: Vec2,
  count: number,
  rng: () => number,
  c: { minEnemyToPlayerDist: number; minEnemyToEnemyDist: number }
): Vec2[] {
  const distFromPlayer = bfsDistances(maze, player);

  // Sort walkables by "farther from player" first, then random within bands.
  const candidates = walkables
    .map((p) => ({ p, d: distFromPlayer[p.y]?.[p.x] ?? Infinity }))
    .filter((v) => Number.isFinite(v.d))
    .sort((a, b) => (b.d - a.d) || (rng() - 0.5));

  const picked: Vec2[] = [];
  for (const { p, d } of candidates) {
    if (picked.length >= count) break;
    if (d < c.minEnemyToPlayerDist) continue;
    if (!farEnoughFromAll(p, picked, c.minEnemyToEnemyDist)) continue;
    picked.push(p);
  }

  // Fallback: relax constraints if not enough
  if (picked.length < count) {
    const loose = shuffled(walkables, rng);
    for (const p of loose) {
      if (picked.length >= count) break;
      if (!farEnoughFromAll(p, picked, Math.max(1, Math.floor(c.minEnemyToEnemyDist / 2)))) continue;
      if (manhattan(p, player) < Math.max(1, Math.floor(c.minEnemyToPlayerDist / 2))) continue;
      picked.push(p);
    }
  }

  // Final fallback: just random remaining
  while (picked.length < count) {
    const p = walkables[Math.floor(rng() * walkables.length)];
    if (p && farEnoughFromAll(p, picked, 1) && manhattan(p, player) >= 1) picked.push(p);
  }

  return picked;
}

function pickTargetSpawns(
  maze: MazeLike,
  walkables: Vec2[],
  player: Vec2,
  count: number,
  rng: () => number,
  c: { minTargetToPlayerDist: number; minTargetToTargetDist: number; spreadTargets: boolean }
): Vec2[] {
  const baseCandidates = walkables.filter((p) => manhattan(p, player) >= c.minTargetToPlayerDist);

  if (baseCandidates.length === 0) {
    // if maze is tiny, ignore player distance
    return pickRandomWithSpacing(walkables, [], count, rng, 1);
  }

  if (!c.spreadTargets) {
    return pickRandomWithSpacing(baseCandidates, [], count, rng, c.minTargetToTargetDist);
  }

  // Spread by farthest sampling:
  // 1) start from a point far from player
  // 2) repeatedly add the point that maximizes min distance to already picked
  const distFromPlayer = bfsDistances(maze, player);
  const sorted = baseCandidates
    .map((p) => ({ p, d: distFromPlayer[p.y]?.[p.x] ?? Infinity }))
    .filter((v) => Number.isFinite(v.d))
    .sort((a, b) => (b.d - a.d) || (rng() - 0.5));

  const picked: Vec2[] = [];
  const start = sorted[0]?.p ?? baseCandidates[Math.floor(rng() * baseCandidates.length)];
  if (start) picked.push(start);

  while (picked.length < count) {
    let best: Vec2 | null = null;
    let bestScore = -Infinity;

    for (const p of baseCandidates) {
      if (picked.some((q) => q.x === p.x && q.y === p.y)) continue;

      const score = minDistanceToSet(p, picked);
      // enforce minimum spacing (soft)
      if (score < c.minTargetToTargetDist) continue;

      // add a tiny random jitter to avoid deterministic ties
      const jitter = rng() * 0.01;
      if (score + jitter > bestScore) {
        bestScore = score + jitter;
        best = p;
      }
    }

    if (!best) break;
    picked.push(best);
  }

  // If still not enough, fill randomly with spacing (relaxed)
  if (picked.length < count) {
    const rest = pickRandomWithSpacing(
      baseCandidates,
      picked,
      count - picked.length,
      rng,
      Math.max(1, Math.floor(c.minTargetToTargetDist / 2))
    );
    picked.push(...rest);
  }

  while (picked.length < count) {
    const p = baseCandidates[Math.floor(rng() * baseCandidates.length)];
    if (p && farEnoughFromAll(p, picked, 1)) picked.push(p);
  }

  return picked.slice(0, count);
}

function pickRandomWithSpacing(
  candidates: Vec2[],
  already: Vec2[],
  count: number,
  rng: () => number,
  minDist: number
): Vec2[] {
  const pool = shuffled(candidates, rng);
  const picked: Vec2[] = [];
  for (const p of pool) {
    if (picked.length >= count) break;
    if (!farEnoughFromAll(p, already, minDist)) continue;
    if (!farEnoughFromAll(p, picked, minDist)) continue;
    picked.push(p);
  }
  return picked;
}

function farEnoughFromAll(p: Vec2, arr: Vec2[], minDist: number): boolean {
  for (const q of arr) {
    if (manhattan(p, q) < minDist) return false;
  }
  return true;
}

function minDistanceToSet(p: Vec2, set: Vec2[]): number {
  let m = Infinity;
  for (const q of set) {
    const d = manhattan(p, q);
    if (d < m) m = d;
  }
  return m;
}

function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * BFS distances on grid (4-neighborhood).
 * Returns dist[y][x] = steps, Infinity if unreachable.
 */
function bfsDistances(maze: MazeLike, start: Vec2): number[][] {
  const dist: number[][] = Array.from({ length: maze.height }, () =>
    Array.from({ length: maze.width }, () => Infinity)
  );

  const q: Vec2[] = [];
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
      if (n.x < 0 || n.y < 0 || n.x >= maze.width || n.y >= maze.height) continue;
      if (maze.isWall(n.x, n.y)) continue;
      if (dist[n.y][n.x] <= cd + 1) continue;
      dist[n.y][n.x] = cd + 1;
      q.push(n);
    }
  }

  return dist;
}

/**
 * Deterministic RNG (mulberry32).
 * https://stackoverflow.com/a/47593316
 */
function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
