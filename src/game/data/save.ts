export type SaveData = {
    level: number;
    hintEnabled: boolean;
  };
  
  const KEY = "kotoba-meiro-save";
  
  export function loadSave(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { level: 1, hintEnabled: true };
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        level: typeof parsed.level === "number" ? parsed.level : 1,
        hintEnabled: typeof parsed.hintEnabled === "boolean" ? parsed.hintEnabled : true,
      };
    } catch {
      return { level: 1, hintEnabled: true };
    }
  }
  
  export function saveData(data: SaveData): void {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  