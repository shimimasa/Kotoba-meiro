 export type GameState = {

  hintEnabled: boolean;
  running: boolean;

  // --- Maze runtime (optional: renderer/engineが参照)
  maze?: {
    w: number;
    h: number;
    grid: string[];
    walkable: boolean[][];

    start: { x: number; y: number };
    goal: { x: number; y: number };

    // a-e に割り当てられた文字
    letters: Array<{ key: string; index: number; letter: string; pos: { x: number; y: number } }>;

    // S→a→b→c→d→e→G の最短結合ルート
    route?: { path: Array<{ x: number; y: number }>; length: number };

    // player
    player: { x: number; y: number };
    nextLetterIndex: number;
  };
};