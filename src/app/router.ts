import type { Settings } from "../game/data/settings";
import type { GameResult } from "../game/engine/engine";
import { loadSave, saveData, type SaveData } from "../game/data/save";

export type RouteName = "start" | "settings" | "game" | "result";

export type ScreenFactory = (router: Router) => HTMLElement;

export type Router = {
  register: (name: RouteName, factory: ScreenFactory) => void;
  go: (to: RouteName) => void;

  getSettings: () => Settings;
  setSettings: (next: Settings) => void;

  getResult: () => GameResult | null;
  setResult: (r: GameResult | null) => void;
};

export function createRouter(root: HTMLElement): Router {
  const routes = new Map<RouteName, ScreenFactory>();

  const save = loadSave();
  let settings: Settings = {
    hintEnabled: save.hintEnabled,
    level: 1 as number,
  };

  let lastResult: GameResult | null = null;

  function clearRoot() {
    root.innerHTML = "";
  }

  function render(to: RouteName) {
    const factory = routes.get(to);
    if (!factory) throw new Error(`Route not registered: ${to}`);
    clearRoot();
    root.appendChild(factory(router));
  }

  const router: Router = {
    register(name, factory) {
      routes.set(name, factory);
    },

    go(to) {
      render(to);
    },

    getSettings() {
      return settings;
    },

    setSettings(next) {
      settings = next;
      saveData({ hintEnabled: next.hintEnabled } as SaveData);
    },

    getResult() {
      return lastResult;
    },

    setResult(r) {
      lastResult = r;
    },
  };

  return router;
}
