import type { GameState } from "../engine/state";

export function createRenderer(canvas: HTMLCanvasElement, state: GameState) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context not available");

  return {
    onResize() {
      // いまは特に何もしない
    },
    render() {
      // 背景
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // デバッグ表示
      ctx.save();
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("ことばめいろ / Engine boot OK", 12, 28);
      ctx.fillText(`Hint: ${state.hintEnabled ? "ON" : "OFF"}`, 12, 52);
      ctx.restore();
    },
    dispose() {},
  };
}
