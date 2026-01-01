import type { Engine } from "./engine";

export function startLoop(engine: Engine): () => void {
  let raf = 0;
  let last = performance.now();
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000); // 50ms cap
    last = now;

    engine.update(dt);
    engine.render();

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    engine.dispose();
  };
}
