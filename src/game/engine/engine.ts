import type { GameState } from "./state";
import { createRenderer } from "../render/renderer";

export type Engine = {
  update: (dt: number) => void;
  render: () => void;
  dispose: () => void;
};

export function createEngine(opts: {
  canvas: HTMLCanvasElement;
  hintEnabled: boolean;
  onExit?: () => void;
}): Engine {
  const { canvas, hintEnabled } = opts;

  const state: GameState = {
    hintEnabled,
    running: true,
  };

  const renderer = createRenderer(canvas, state);

  // resize（最小）
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    renderer.onResize();
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    update(dt) {
      if (!state.running) return;
      // TODO: input/movement/collision などをここに追加
      void dt;
    },
    render() {
      renderer.render();
    },
    dispose() {
      state.running = false;
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
