 import { createRouter } from "./app/router";

// ===== Global styles (index.css が無い前提) =====
const style = document.createElement("style");
style.textContent = `
  html, body { height: 100%; margin: 0; padding: 0; }
  body {
    background: #111;
    overflow: hidden;
    overscroll-behavior: none;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  }
  #app { height: 100%; display: flex; flex-direction: column; }
  button { font: inherit; }
`;
document.head.appendChild(style);
 
 const router = createRouter(document.getElementById("app")!);
 
 router.go("start");
