import { StartScreen } from "./screens/StartScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";

import { loadSave, saveData } from "../game/data/save";
import { defaultSettings, type Settings } from "../game/data/settings";
import type { GameResult } from "../game/engine/engine";

export type RouteName = "start" | "settings" | "game" | "result";

export type Router = {
  go: (to: RouteName) => void;
  getSettings: () => Settings;
  setSettings: (next: Settings) => void;

  // Result
  setResult: (r: GameResult) => void;
  getResult: () => GameResult | null;
};

export function createRouter(root: HTMLElement): Router {
  // saved settings
  const saved = loadSave();
  let settings: Settings = {
    ...defaultSettings,
    hintEnabled: typeof saved.hintEnabled === "boolean" ? saved.hintEnabled : defaultSettings.hintEnabled,
  };

  // in-memory result
  let lastResult: GameResult | null = null;

  const mount = (el: HTMLElement) => {
    root.innerHTML = "";
    root.appendChild(el);
  };

  const router: Router = {
    go(to) {
      if (to === "start") return mount(StartScreen(router));
      if (to === "settings") return mount(SettingsScreen(router));
      if (to === "game") return mount(GameScreen(router));
      if (to === "result") {
        // 結果が無いのに result へ来たら start へ戻す
        if (!lastResult) return mount(StartScreen(router));
        return mount(ResultScreen(router));
      }

      // fallback
      return mount(StartScreen(router));
    },

    getSettings() {
      return settings;
    },

    setSettings(next) {
      settings = next;
      const current = loadSave();
      saveData({ ...current, hintEnabled: next.hintEnabled });
    },

    setResult(r) {
      lastResult = r;
    },

    getResult() {
      return lastResult;
    },
  };

  // 初期表示
  router.go("start");
  return router;
}
