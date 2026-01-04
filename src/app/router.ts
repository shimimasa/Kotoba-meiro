 import type { Settings } from "../game/data/settings";

 import { GameScreen } from "./screens/GameScreen";
 import { ResultScreen } from "./screens/ResultScreen";
 import { SettingsScreen } from "./screens/SettingsScreen";
 import { StartScreen } from "./screens/StartScreen";
 import type { GameResult } from "../game/engine/engine";
 import { defaultSettings, loadSettings, saveSettings } from "../game/data/save";

export type RouteName = "start" | "settings" | "game" | "result";
 
 export type Router = {
   go: (to: RouteName) => void;
   getSettings: () => Settings;
   setSettings: (next: Settings) => void;
  getResult: () => GameResult | null;
  setResult: (r: GameResult) => void;
 };
 
 export function createRouter(root: HTMLElement) {
   
  const save = loadSettings();
   let settings: Settings = { ...defaultSettings, ...save };
   let lastResult: GameResult | null = null;
 
   function clearRoot() {
     root.innerHTML = "";
   }
 
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
      if (to === "result") {
        root.appendChild(ResultScreen(router));
        return;
      }
       const _exhaustive: never = to;
       return _exhaustive;
     },
    getResult() {
      return lastResult;
    },
    setResult(r) {
      lastResult = r;
    },
     getSettings() {
       return settings;
     },
     setSettings(next) {
       settings = next;
       saveSettings(settings);
     },
   };
 
   return router;
 }
