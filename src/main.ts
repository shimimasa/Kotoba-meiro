
import { createRouter } from "./app/router";
import { StartScreen } from "./app/screens/StartScreen";
import { SettingsScreen } from "./app/screens/SettingsScreen";
import { GameScreen } from "./app/screens/GameScreen";
import { ResultScreen } from "./app/screens/ResultScreen";
 

// ===== Global styles (index.css が無い前提) =====
const style = document.createElement("style");
style.textContent = `
  html, body { height: 100%; margin: 0; padding: 0; }
  body { overflow: hidden; overscroll-behavior: none; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  #app { height: 100%; }
  button { -webkit-tap-highlight-color: transparent; }
`;
+document.head.append(style);
 
const root = document.getElementById("app")!;

// router.ts 側が go() 内で Screen を呼び分ける実装なので、
// main.ts で register は不要（というか Router 型に存在しない）
const router = createRouter(root);

 router.go("start");
