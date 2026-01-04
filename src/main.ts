import { createRouter } from "./app/router";
 
 const root = document.getElementById("app");
 if (!root) throw new Error("#app not found");
 
// ===== Global styles (index.css が無い前提) =====
const style = document.createElement("style");
style.textContent = `
  html, body { height: 100%; margin: 0; padding: 0; }
  body {
    overflow: hidden;
    overscroll-behavior: none;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    background: #000;
    color: #fff;
  }
  #app { height: 100%; background: #000; }
  button { -webkit-tap-highlight-color: transparent; }
  .pcHint { font-size: 12px; opacity: 0.7; }
  @media (pointer: coarse) { .pcHint { display: none; } }
`;
document.head.appendChild(style);

 const router = createRouter(root);
 router.go("start");
