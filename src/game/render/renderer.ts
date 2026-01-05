import type { GameState } from "../engine/state";

type Ctx = CanvasRenderingContext2D;

export function createRenderer(canvas: HTMLCanvasElement, state: GameState) {
  const ctxMaybe = canvas.getContext("2d");
  if (!ctxMaybe) throw new Error("2D context not available");
  const ctx: Ctx = ctxMaybe;

  const getDpr = () => window.devicePixelRatio || 1;

  function resizeToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const nextW = Math.max(1, Math.floor(rect.width * dpr));
    const nextH = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== nextW) canvas.width = nextW;
    if (canvas.height !== nextH) canvas.height = nextH;
  }

  function clearBackground() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  }

  // state が未初期化でも落ちないように “それっぽく” 迷路を抽出
  function getMazeLike(): any | null {
    const s: any = state as any;
    return s?.maze ?? s?.mazeState ?? s?.level?.maze ?? null;
  }

  function getPlayerLike(): any | null {
    const s: any = state as any;
    return s?.player ?? s?.maze?.player ?? s?.mazeState?.player ?? null;
  }

  function getEnemiesLike(): any[] {
    const s: any = state as any;
    const e = s?.enemies ?? s?.maze?.enemies ?? s?.mazeState?.enemies;
    return Array.isArray(e) ? e : [];
  }

  function renderMaze() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    // CSSピクセル基準で描画
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 背景
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const maze = getMazeLike();
    if (!maze) {
      ctx.restore();
      return;
    }

    // grid: string[] を最優先で扱う（例: "####", "#S..G#"）
    const grid: string[] | null = Array.isArray(maze.grid) ? maze.grid : null;
    if (!grid || grid.length === 0) {
      ctx.restore();
      return;
    }

    const rows = grid.length;
    const cols = Math.max(...grid.map((r) => (typeof r === "string" ? r.length : 0)));

    // 迷路を「canvas中央」に置く（余白があっても中央寄せ）
    // ※ GameScreen 側で “高さ基準スケール” をやっている前提でも崩れないようにする
    const padding = 18; // 外枠の少しの余白
    const availW = Math.max(1, rect.width - padding * 2);
    const availH = Math.max(1, rect.height - padding * 2);

    const cell = Math.floor(Math.min(availW / cols, availH / rows));
    const boardW = cell * cols;
    const boardH = cell * rows;

    const ox = Math.floor((rect.width - boardW) / 2);
    const oy = Math.floor((rect.height - boardH) / 2);

    // タイル色
    const wallColor = "#1c1c1c";
    const pathColor = "#f4f4f4";
    const pelletColor = "#333";
    const goalColor = "#cfe6ff";
    const letterTileColor = "#f6e39a";
    const gridLine = "rgba(255,255,255,0.08)";

    // a,b,c... -> ひらがな対応（maze.letters があればそれを使う）
    const letters: string[] | null = Array.isArray(maze.letters) ? maze.letters : null;

    function charAt(x: number, y: number) {
      const r = grid?.[y] ?? "";
      return r[x] ?? " ";
    }

    // 盤面
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const ch = charAt(x, y);
        const px = ox + x * cell;
        const py = oy + y * cell;

        const isWall = ch === "#";
        const isGoal = ch === "G";
        const isPellet = ch === ".";
        const isStart = ch === "S";

        // a-z / A-Z を “文字マス” とみなす
        const isLetterMark =
          (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");

        // tile
        if (isWall) {
          ctx.fillStyle = wallColor;
          ctx.fillRect(px, py, cell, cell);
        } else {
          ctx.fillStyle = isGoal ? goalColor : pathColor;
          ctx.fillRect(px, py, cell, cell);
        }

        // grid line（薄く）
        ctx.strokeStyle = gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);

        // pellet
        if (isPellet) {
          ctx.fillStyle = pelletColor;
          const r = Math.max(2, Math.floor(cell * 0.08));
          ctx.beginPath();
          ctx.arc(px + cell / 2, py + cell / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // letter tile
        if (isLetterMark) {
          ctx.fillStyle = letterTileColor;
          ctx.fillRect(px, py, cell, cell);

          // 表示文字
          let label = ch;
          if (letters) {
            // a->0, b->1... / A も許容
            const idx =
              (ch >= "a" && ch <= "z")
                ? ch.charCodeAt(0) - "a".charCodeAt(0)
                : ch.charCodeAt(0) - "A".charCodeAt(0);
            if (idx >= 0 && idx < letters.length) label = letters[idx];
          }

          ctx.fillStyle = "#3a2a00";
          ctx.font = `600 ${Math.floor(cell * 0.55)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, px + cell / 2, py + cell / 2 + 1);
        }

        // start は見た目を変えたいならここで（今は何もしない）
        if (isStart) {
          // noop
        }
      }
    }

    // ゴールの “G” を上書き表示（青タイルの上に）
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (charAt(x, y) !== "G") continue;
        const px = ox + x * cell;
        const py = oy + y * cell;

        ctx.fillStyle = "#1b2a3a";
        ctx.font = `700 ${Math.floor(cell * 0.52)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("G", px + cell / 2, py + cell / 2);
      }
    }

    // プレイヤー
    const player = getPlayerLike();
    if (player && typeof player.x === "number" && typeof player.y === "number") {
      const px = ox + player.x * cell + cell / 2;
      const py = oy + player.y * cell + cell / 2;

      // dir: {x,y} か dir文字列を想定
      let dx = 1, dy = 0;
      const dir = player.dir ?? player.direction;
      if (dir) {
        if (typeof dir === "string") {
          if (dir === "left") (dx = -1), (dy = 0);
          if (dir === "right") (dx = 1), (dy = 0);
          if (dir === "up") (dx = 0), (dy = -1);
          if (dir === "down") (dx = 0), (dy = 1);
        } else if (typeof dir.x === "number" && typeof dir.y === "number") {
          dx = dir.x; dy = dir.y;
          // 0,0 のときだけデフォルト
          if (dx === 0 && dy === 0) { dx = 1; dy = 0; }
        }
      }

      // 三角形
      const size = Math.max(6, Math.floor(cell * 0.22));
      const tip = { x: px + dx * (cell * 0.22), y: py + dy * (cell * 0.22) };
      const left = { x: px + (-dy) * size, y: py + (dx) * size };
      const right = { x: px + (dy) * size, y: py + (-dx) * size };

      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.closePath();
      ctx.fill();
    }

    // 敵（もし居れば）
    const enemies = getEnemiesLike();
    for (const e of enemies) {
      if (!e || typeof e.x !== "number" || typeof e.y !== "number") continue;
      const ex = ox + e.x * cell + cell / 2;
      const ey = oy + e.y * cell + cell / 2;
      const r = Math.max(6, Math.floor(cell * 0.22));
      ctx.fillStyle = "#7dd3fc"; // 水色
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function render() {
    resizeToDisplaySize();

    // まず背景だけ塗って、落ちても “真っ黒のまま” になりにくくする
    clearBackground();

    try {
      renderMaze();
    } catch (e) {
      // 描画が壊れてもループを止めない
      // （ここで例外が外に漏れると “以後ずっと真っ暗” になる）
      clearBackground();
      // eslint-disable-next-line no-console
      console.error("render error:", e);
    }
  }

  function onResize() {
    render();
  }

  function dispose() {
    // 今は特にクリーンアップ無し
  }

  return { render, onResize, dispose };
}
