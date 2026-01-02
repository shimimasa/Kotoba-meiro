
export type Point = { x: number; y: number };

export type PathResult =
  | { ok: true; path: Point[]; length: number }
  | { ok: false; reason: "out_of_bounds" | "blocked" | "unreachable" };

export function findShortestPath(walkable: boolean[][], start: Point, goal: Point): PathResult {
  const h = walkable.length;
  const w = h > 0 ? walkable[0].length : 0;

  if (!inBounds(w, h, start) || !inBounds(w, h, goal)) return { ok: false, reason: "out_of_bounds" };
  if (!walkable[start.y][start.x] || !walkable[goal.y][goal.x]) return { ok: false, reason: "blocked" };
  if (start.x === goal.x && start.y === goal.y) return { ok: true, path: [start], length: 0 };

  const dist: number[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => -1));
  const prev: (Point | null)[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => null));
  const q: Point[] = [];

  dist[start.y][start.x] = 0;
  q.push(start);

  let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    const cd = dist[cur.y][cur.x];

    for (const nb of neighbors4(cur)) {
      if (!inBounds(w, h, nb)) continue;
      if (!walkable[nb.y][nb.x]) continue;
      if (dist[nb.y][nb.x] !== -1) continue;

      dist[nb.y][nb.x] = cd + 1;
      prev[nb.y][nb.x] = cur;

      if (nb.x === goal.x && nb.y === goal.y) {
        head = q.length;
        break;
      }
      q.push(nb);
    }
  }

  if (dist[goal.y][goal.x] === -1) return { ok: false, reason: "unreachable" };

  const path: Point[] = [];
  let cur: Point | null = goal;
  while (cur) {
    path.push(cur);
    cur = prev[cur.y][cur.x];
  }
  path.reverse();

  return { ok: true, path, length: path.length - 1 };
}

export function buildRoute(walkable: boolean[][], start: Point, checkpoints: Point[], goal: Point): PathResult {
  const nodes = [start, ...checkpoints, goal];
  const combined: Point[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const seg = findShortestPath(walkable, a, b);
    if (!seg.ok) return seg;
    if (combined.length === 0) combined.push(...seg.path);
    else combined.push(...seg.path.slice(1));
  }

  return { ok: true, path: combined, length: combined.length - 1 };
}

function neighbors4(p: Point): Point[] {
  return [
    { x: p.x + 1, y: p.y },
    { x: p.x - 1, y: p.y },
    { x: p.x, y: p.y + 1 },
    { x: p.x, y: p.y - 1 },
  ];
}

function inBounds(w: number, h: number, p: Point): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < w && p.y < h;
}
