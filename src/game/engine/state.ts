export type Direction = "up" | "down" | "left" | "right";

export type EnemyState = {
  x: number; // cell coords（floatでもOK）
  y: number;
  dir: Direction;
};

export type MazeState = {
  w: number;
  h: number;
  grid: string[];
  walkable: boolean[][];
  letters: Array<{ x: number; y: number; ch: string; collected: boolean }>;
  start: { x: number; y: number };
  goal: { x: number; y: number };

  player: { x: number; y: number; dir: Direction };

  pellets: Array<{ x: number; y: number; eaten: boolean }>;
  nextIndex: number;

  score: number;
  time: number;

  finished: boolean;
  flash: number;
  mouthOpen: boolean;
  mouthTimer: number;
  lastEat: number;

  hintEnabled: boolean;

  // 敵は今は空でもOK（rendererが参照しても落ちない）
  enemies?: EnemyState[];
};

export type GameResult = {
  ok: boolean;
  time: number;
  score: number;
  pelletsEaten: number;
  pelletsTotal: number;
  level: number;
};

export type GameState = {
  hintEnabled: boolean;
  running: boolean;
  level: number;
  maze?: MazeState;
  result: GameResult | null;
};

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  hintEnabled?: boolean;
  level?: number;
  onExit?: () => void;
  onResult?: (r: GameResult) => void;
};

export type Engine = {
  getState: () => GameState;
  setInput: (dir: Direction | null) => void;
  update: (dt: number) => void;
  render: () => void;
  dispose: () => void;

  // optional helpers
  reset: (level?: number) => void;
  setHintEnabled: (on: boolean) => void;
};
