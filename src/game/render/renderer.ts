// src/game/render/renderer.ts
import type { GameState } from "../engine/state";

type AnyMaze = {
  w: number;
  h: number;
  walls: boolean[][];
  pellets: boolean[][];
  letters: Array<{ x: number; y: number; ch: string; collected: boolean }>;
  goal: { x: number; y: number };
  player: { x: number; y: number; dir: any; mouthOpen?: boolean };
  enemy?: { x: number; y: number; dir: any };
};

export function createRenderer(canvas: HTMLCanvasElement, state: GameState) {
  const ctxMaybe = canvas.getContext("2d");
  if (!ctxMaybe) throw new Error("2D context not available");
  const ctx = ctxMaybe; // <- ここから先は non-null

  const getDpr = () => window.devicePixelRatio || 1;

  function resizeToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    const nextW = Math.max(1, Math.floor(rect.width * dpr));
    const nextH = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== nextW) canvas.width = nextW;
    if (canvas.height !== nextH) canvas.height = nextH;
  }

  function clearAsBackground() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // CSS px
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  }

  function render() {
    resizeToDisplaySize();

    const m = (state as any).maze as AnyMaze | undefined;
    if (!m) {
      // 初期化前でも落ちない
      clearAsBackground();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    // 以降は CSS px 座標で描く（DPRは setTransform で吸収）
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 背景
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 高さ基準スケール（ただし横に収まらない場合は縮める）
    const cellByH = rect.height / m.h;
    const cellByW = rect.width / m.w;
    const cell = Math.min(cellByH, cellByW);

    const boardW = cell * m.w;
    const boardH = cell * m.h;

    const ox = (rect.width - boardW) / 2;
    const oy = (rect.height - boardH) / 2;

    // 外枠（見た目ちょい良く）
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(ox, oy, boardW, boardH);

    // グリッド（薄い線）
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= m.w; x++) {
      const px = ox + x * cell;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + boardH);
      ctx.stroke();
    }
    for (let y = 0; y <= m.h; y++) {
      const py = oy + y * cell;
      ctx.beginPath();
      ctx.moveTo(ox, py);
      ctx.lineTo(ox + boardW, py);
      ctx.stroke();
    }

    // 壁
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (!m.walls?.[y]?.[x]) continue;
        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
      }
    }

    // ペレット
    if (m.pellets) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const r = Math.max(1, cell * 0.08);
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          if (!m.pellets?.[y]?.[x]) continue;
          const cx = ox + x * cell + cell / 2;
          const cy = oy + y * cell + cell / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ゴール
    if (m.goal) {
      ctx.fillStyle = "rgba(120,180,255,0.35)";
      ctx.fillRect(ox + m.goal.x * cell, oy + m.goal.y * cell, cell, cell);

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.font = `${Math.max(10, Math.floor(cell * 0.55))}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "G",
        ox + m.goal.x * cell + cell / 2,
        oy + m.goal.y * cell + cell / 2
      );
    }

    // 文字
    if (m.letters) {
      for (const L of m.letters) {
        if (L.collected) continue;
        ctx.fillStyle = "rgba(255,240,150,0.85)";
        ctx.fillRect(ox + L.x * cell, oy + L.y * cell, cell, cell);

        ctx.fillStyle = "rgba(30,20,0,0.85)";
        ctx.font = `${Math.max(12, Math.floor(cell * 0.62))}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(L.ch, ox + L.x * cell + cell / 2, oy + L.y * cell + cell / 2);
      }
    }

    // プレイヤー（簡易：三角の向き）
    if (m.player) {
      const px = ox + m.player.x * cell + cell / 2;
      const py = oy + m.player.y * cell + cell / 2;
      const size = cell * 0.32;

      // dir が "up/down/left/right" でも数値でも落ちないように丸める
      const dir = m.player.dir;
      let ang = 0;
      if (dir === "right" || dir === 1) ang = 0;
      else if (dir === "down" || dir === 2) ang = Math.PI / 2;
      else if (dir === "left" || dir === 3) ang = Math.PI;
      else if (dir === "up" || dir === 0) ang = -Math.PI / 2;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);

      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.9, size * 0.65);
      ctx.lineTo(-size * 0.9, -size * 0.65);
      ctx.closePath();
      ctx.fill();

      // 目
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.arc(size * 0.25, -size * 0.22, Math.max(1, size * 0.12), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 敵（もし居れば：四角）
    if (m.enemy) {
      ctx.fillStyle = "rgba(160,120,255,0.9)";
      ctx.fillRect(ox + m.enemy.x * cell, oy + m.enemy.y * cell, cell, cell);
    }

    ctx.restore();
  }

  return {
    render,
    resizeToDisplaySize,
  };
}
