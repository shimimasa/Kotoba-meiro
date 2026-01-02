import type { GameState } from "../engine/state";

export function createRenderer(canvas: HTMLCanvasElement, state: GameState) {
  const ctxMaybe = canvas.getContext("2d");
  if (!ctxMaybe) throw new Error("2D context not available");
  const ctx = ctxMaybe;

  const getDpr = () => window.devicePixelRatio || 1;

  function resizeToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    const nextW = Math.max(1, Math.floor(rect.width * dpr));
    const nextH = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== nextW) canvas.width = nextW;
    if (canvas.height !== nextH) canvas.height = nextH;
  }

  function renderDebug() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.fillStyle = "#111";
    ctx.font = "16px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("renderer debug", 12, 12);

    ctx.fillStyle = "#555";
    ctx.font = "13px system-ui";
    ctx.fillText(`hintEnabled: ${state.hintEnabled}`, 12, 36);
    ctx.fillText(`running: ${state.running}`, 12, 54);
  }

  function renderMaze() {
    const m = state.maze;
    if (!m) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);

    // CSSピクセル基準で描画（setTransformでDPR吸収）
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const cell = Math.min(cssW / m.w, cssH / m.h);
    const ox = (cssW - cell * m.w) / 2;
    const oy = (cssH - cell * m.h) / 2;

    // 背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    // 壁/通路
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const px = ox + x * cell;
        const py = oy + y * cell;

        if (!m.walkable[y][x]) {
          ctx.fillStyle = "#222";
          ctx.fillRect(px, py, cell, cell);
        } else {
          ctx.fillStyle = "#f4f4f4";
          ctx.fillRect(px, py, cell, cell);
        }
      }

    // ペレット（残っているものだけ）
    if (m.pellets) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      const r = Math.max(1, cell * 0.06);
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          if (!m.pellets[y]?.[x]) continue;
          const cx = ox + x * cell + cell / 2;
          const cy = oy + y * cell + cell / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    }

    // ゴール
    {
      const px = ox + m.goal.x * cell;
      const py = oy + m.goal.y * cell;
      ctx.fillStyle = "#cfe8ff";
      ctx.fillRect(px, py, cell, cell);
      ctx.fillStyle = "#1b3a57";
      ctx.font = `${Math.floor(cell * 0.6)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("G", px + cell / 2, py + cell / 2);
    }

    // 文字（未取得は表示、取得済は薄く）
    for (const l of m.letters) {
      const px = ox + l.pos.x * cell;
      const py = oy + l.pos.y * cell;
      const got = l.index < m.nextLetterIndex;

      ctx.fillStyle = got ? "#eaeaea" : "#fff4c2";
      ctx.fillRect(px, py, cell, cell);

      ctx.fillStyle = got ? "#999" : "#5a4a00";
      ctx.font = `${Math.floor(cell * 0.55)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(l.letter, px + cell / 2, py + cell / 2);
    }

    // ヒント：ルート表示（あれば）
    if (state.hintEnabled && m.route) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (const p of m.route.path) {
        const px = ox + p.x * cell;
        const py = oy + p.y * cell;
        ctx.fillRect(px + cell * 0.25, py + cell * 0.25, cell * 0.5, cell * 0.5);
      }
    }


    
    // プレイヤー（パックマン風）
    {
      const px = ox + m.player.x * cell;
      const py = oy + m.player.y * cell;
      const cx = px + cell / 2;
      const cy = py + cell / 2;
      const r = cell * 0.38;

      const dir = m.player.dir;
      const mouthOpen = !!(m as any).mouthOpen;
      // 開き具合（閉=小、開=大）
      const gap = mouthOpen ? Math.PI / 5 : Math.PI / 12;

      const baseAngle =
        dir === "right" ? 0 :
        dir === "down"  ? Math.PI / 2 :
        dir === "left"  ? Math.PI :
        -Math.PI / 2; // up

      const a1 = baseAngle + gap;
      const a2 = baseAngle - gap;

      ctx.fillStyle = "#ff6b6b"; // まずは赤（あとで黄色にしたいならここ）
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a1, a2, true);
      ctx.closePath();
      ctx.fill();

      // 目（上向き/下向きでも自然に見えるよう少し上に）
      ctx.fillStyle = "#111";
      const eyeOffset = dir === "down" ? 0 : -r * 0.25;
      ctx.beginPath();
      ctx.arc(cx + r * 0.15, cy + eyeOffset, r * 0.10, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD（進捗）
    ctx.fillStyle = "#111";
    ctx.font = "13px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`progress: ${m.nextLetterIndex}/${m.letters.length}  score:${m.score ?? 0}  hint:${state.hintEnabled ? "ON" : "OFF"}`, 12, 12);
  }

  return {
    onResize() {
      resizeToDisplaySize();
    },
    render() {
      resizeToDisplaySize();
      if (state.maze) renderMaze();
      else renderDebug();
    },
    dispose() {
      // 特になし
    },
  };
}
