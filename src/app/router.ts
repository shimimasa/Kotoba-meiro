
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

  // 1) Save/Settings 初期化
  const save = loadSave();
  let settings: Settings = {
    ...defaultSettings,
    ...(save ?? {}),
  };

  // 旧形式（save.hintEnabled など）がある場合の吸収（保険）
  if (typeof (save as any)?.hintEnabled === "boolean") {
    (settings as any).hintEnabled = (save as any).hintEnabled;
  }

  // 2) 画面マウント（前画面を破棄）
  let current: HTMLElement | null = null;

  const mount = (el: HTMLElement) => {
    if (current && current.isConnected) current.remove();
    root.replaceChildren(el);
    current = el;
  };

  // 3) Router 本体
  const router: Router = {
    go(to) {
      if (to === "start") {
        mount(StartScreen(router));
        return;
      }
      if (to === "settings") {
        mount(SettingsScreen(router));
        return;
      }
      if (to === "game") {
        mount(GameScreen(router));
        return;
      }
      // 将来拡張用：未知ルートは start に落とす
      mount(StartScreen(router));
    },
    getSettings() {
      return settings;
    },
    setSettings(next) {
      settings = next;
      // 保存：settings を丸ごと保存（互換性のため hintEnabled もトップに写す）
      const currentSave = loadSave();
      saveData({
        ...currentSave,
        settings: next,
        hintEnabled: (next as any).hintEnabled,
      } as any);
    },
  };

  // 初期ルート
  router.go("start");
  return router;
 }