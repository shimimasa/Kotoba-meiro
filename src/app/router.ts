import type { Settings } from "../game/data/settings";
import type { GameResult } from "../game/engine/engine";
import { loadSave, saveData } from "../game/data/save";

import { StartScreen } from "./screens/StartScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";

export type RouteName = "start" | "settings" | "game" | "result";

export type Router = {
  go: (to: RouteName) => void;
  getSettings: () => Settings;
  setSettings: (next: Settings) => void;
  getResult: () => GameResult | null;
  setResult: (r: GameResult) => void;
};

export function createRouter(root: HTMLElement): Router {
  // SaveData から Settings を復元（settings.ts がどうなっていても動くよう最小デフォルトをここで用意）
  const saved = loadSave();
  let settings = {
    hintEnabled: saved.hintEnabled ?? true,
    level: 1 as number,
  } as Settings;

  let lastResult: GameResult | null = null;

  function clearRoot() {
    // appendChild の「親子循環」や取り回し事故を避けるため replaceChildren を使う
    root.replaceChildren();
  }

  function mount(el: HTMLElement) {
    clearRoot();
    root.appendChild(el);
  }

  const router: Router = {
    go: (to) => {
      // ここで必ず4ルートを解決する（未登録エラーを出さない）
      switch (to) {
        case "start":
          mount(StartScreen(router));
          return;
        case "settings":
          mount(SettingsScreen(router));
          return;
        case "game":
          mount(GameScreen(router));
          return;
        case "result":
          mount(ResultScreen(router));
          return;
        default: {
          // 将来 RouteName を拡張したときの保険
          const _exhaustive: never = to;
          throw new Error(`Unknown route: ${String(_exhaustive)}`);
        }
      }
    },
    getSettings: () => settings,
    setSettings: (next) => {
      settings = next;
      // 永続化
      saveData({ hintEnabled: settings.hintEnabled } as Settings);
    },
    getResult: () => lastResult,
    setResult: (r) => {
      lastResult = r;
    },
  };

  return router;
}