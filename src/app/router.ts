import { StartScreen } from "./screens/StartScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GameScreen } from "./screens/GameScreen";
import { loadSave, saveData } from "../game/data/save";
import { defaultSettings, type Settings } from "../game/data/settings";

export type RouteName = "start" | "settings" | "game";

export type Router = {
  go: (to: RouteName) => void;
  getSettings: () => Settings;
  setSettings: (next: Settings) => void;
};

export function createRouter(root: HTMLElement): Router {
  const save = loadSave();
  let settings: Settings = { ...defaultSettings, hintEnabled: save.hintEnabled };

  const clearRoot = () => (root.innerHTML = "");

  const router: Router = {
    go(to) {
      clearRoot();

      if (to === "start") {
        root.appendChild(StartScreen(router));
        return;
      }
      if (to === "settings") {
        root.appendChild(SettingsScreen(router));
        return;
      }
      if (to === "game") {
        root.appendChild(GameScreen(router));
        return;
      }
      const _exhaustive: never = to;
      throw new Error(`Unknown route: ${_exhaustive}`);
    },
    getSettings() {
      return settings;
    },
    setSettings(next) {
      settings = next;
      // 保存（最小）
      const current = loadSave();
      saveData({ ...current, hintEnabled: next.hintEnabled });
    },
  };

  return router;
}
