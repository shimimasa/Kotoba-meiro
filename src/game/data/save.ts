import type { Settings } from "./settings";
import { defaultSettings } from "./settings";

const KEY = "kotoba-meiro:save";

// router.ts が期待している export を提供
export { defaultSettings };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...parsed,
      // 念のため型安全なフォールバック
      hintEnabled: parsed.hintEnabled ?? defaultSettings.hintEnabled,
      level: parsed.level ?? defaultSettings.level,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// 互換用（古い呼び出しが残っていても動くように）
export type SaveData = Pick<Settings, "hintEnabled">;
export function loadSave(): SaveData {
  const s = loadSettings();
  return { hintEnabled: s.hintEnabled };
}
export function saveData(data: SaveData) {
  const s = loadSettings();
  saveSettings({ ...s, hintEnabled: data.hintEnabled });
}