/**
 * 迷路テンプレの基本型
 * ASCIIテンプレを解析して実体化する前段階
 */
export type MazeTemplate = {
    /** テンプレID（例: lv1-a） */
    id: string;
  
    /** 人間向け説明（デバッグ用） */
    description?: string;
  
    /** ASCII迷路データ */
    grid: string[];
  
    /** 使用する文字（順序保証） */
    letters: string[];
  };
  
  /**
   * 解析後のセル種別
   */
  export type CellType =
    | "wall"
    | "path"
    | "start"
    | "goal"
    | "letter";
  
  /**
   * 解析済みセル
   */
  export type MazeCell = {
    x: number;
    y: number;
    type: CellType;
    letter?: string;
  };
  