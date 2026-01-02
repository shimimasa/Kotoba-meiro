
import type { GameState } from "./state";
import { createRenderer } from "../render/renderer";
import { analyzeTemplate } from "../maze/analyzeTemplate";
import { planSpawns } from "../maze/spawnPlanner";
import { buildRoute } from "../maze/path";
import { lv1Templates } from "../maze/templates/lv1";
 
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
 
   // renderer（型が揺れてもいいように any 扱い）
   const renderer: any = createRenderer(opts.canvas, state as any);
 
  // --- Maze init (Lv1テンプレの先頭を使用)
  const template = lv1Templates[0];
  const analyzed = analyzeTemplate(template);
  const plan = planSpawns(template);
  const checkpoints = plan.letters.map((l) => l.pos);
  const routeRes = buildRoute(analyzed.walkable, analyzed.start, checkpoints, analyzed.goal);

  state.maze = {
    w: analyzed.w,
    h: analyzed.h,
    grid: analyzed.grid,
    walkable: analyzed.walkable,
    start: analyzed.start,
    goal: analyzed.goal,
    letters: plan.letters,
    route: routeRes.ok ? { path: routeRes.path, length: routeRes.length } : undefined,
    player: { ...analyzed.start, dir: "right" },
    nextLetterIndex: 0,
  };

    // --- Pacman mouth animation (engine-local)
  let mouthT = 0;
  let mouthOpen = true;
  let movedThisFrame = false;

  // --- Input (arrow/WASD)
  const onKeyDown = (e: KeyboardEvent) => {
    if (!state.running || !state.maze) return;
    const k = e.key.toLowerCase();
    let dx = 0, dy = 0;
    if (k === "arrowup" || k === "w") { dy = -1; state.maze.player.dir = "up"; }
    else if (k === "arrowdown" || k === "s") { dy = 1; state.maze.player.dir = "down"; }
    else if (k === "arrowleft" || k === "a") { dx = -1; state.maze.player.dir = "left"; }
    else if (k === "arrowright" || k === "d") { dx = 1; state.maze.player.dir = "right"; }
    else return;
    e.preventDefault();

    const nx = state.maze.player.x + dx;
    const ny = state.maze.player.y + dy;
    if (nx < 0 || ny < 0 || nx >= state.maze.w || ny >= state.maze.h) return;
    if (!state.maze.walkable[ny][nx]) return;
    state.maze.player = { ...state.maze.player, x: nx, y: ny };
    movedThisFrame = true;

    // 文字取得判定
    const next = state.maze.letters[state.maze.nextLetterIndex];
    if (next && next.pos.x === nx && next.pos.y === ny) {
      state.maze.nextLetterIndex++;
    }

    // ゴール判定（全取得 + G）
    if (state.maze.nextLetterIndex >= state.maze.letters.length) {
      if (state.maze.goal.x === nx && state.maze.goal.y === ny) {
        // とりあえず終了（次：リザルト画面へ）
        state.running = false;
        opts.onExit?.();
      }
    }
  };
  window.addEventListener("keydown", onKeyDown, { passive: false });

   // 初回 & リサイズ時の処理
   const handleResize = () => {
     // renderer側が resize / onResize / setSize のどれでも対応できるようにする
     if (typeof renderer.resize === "function") renderer.resize();
     else if (typeof renderer.onResize === "function") renderer.onResize();
     else if (typeof renderer.resizeToDisplaySize === "function") renderer.resizeToDisplaySize();
   };

   return {
     update(dt: number) {
       if (!state.running) return;
      // 口パク：移動があった時だけパチパチ
      if (movedThisFrame) {
        mouthT += dt;
        // 0.12秒ごとに開閉（好みで0.10〜0.16）
        if (mouthT >= 0.12) {
          mouthT = 0;
          mouthOpen = !mouthOpen;
        }
      } else {
        // 止まってるときは口を閉じ気味で固定
        mouthT = 0;
        mouthOpen = false;
      }
      movedThisFrame = false;

      // rendererが参照できるように state に渡す（軽量）
      // ※ state.maze が存在するときだけ
      if (state.maze) {
        (state.maze as any).mouthOpen = mouthOpen;
      }

       // renderer/update がある場合だけ呼ぶ
       if (typeof renderer.update === "function") renderer.update(dt);
       // 将来：入力/ゲーム進行/クリア判定などはここに
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