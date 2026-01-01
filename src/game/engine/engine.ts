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
  const state: GameState = {
    hintEnabled: opts.hintEnabled,
    running: true,
  };

  const renderer = createRenderer(opts.canvas, state);

  const handleResize = () => renderer.onResize();
  window.addEventListener("resize", handleResize);
  renderer.onResize();

  return {
    update(_dt: number) {
      // ここに順次、input / movement / collision を入れていく
      if (!state.running) return;
    },
    render() {
      renderer.render();
    },
    dispose() {
      state.running = false;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    },
  };
}


