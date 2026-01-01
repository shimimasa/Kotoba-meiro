import type { GameState } from "../engine/state";

export function createRenderer(canvas: HTMLCanvasElement, state: GameState) {
  const ctxMaybe = canvas.getContext("2d");
  if (!ctxMaybe) throw new Error("2D context not available");

  // ★ ここがポイント：narrowing後の値を別constに束縛（これでnull警告が消える）
  const ctx = ctxMaybe;

  const getDpr = () => window.devicePixelRatio || 1;

  function resizeToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    const nextW = Math.max(1, Math.floor(rect.width * dpr));
    const nextH = Math.max(1, Math.floor(rect.height * dpr));

    if (canvas.width !== nextW) canvas.width = nextW;
    if (canvas.height !== nextH) canvas.height = nextH;
  }

  function renderDebug() {
    // CSSピクセルで描画（setTransformでDPRを吸収）
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.font = "16px system-ui, sans-serif";
    ctx.fillStyle = "#111";
    ctx.fillText("ことばめいろ / Renderer OK", 12, 28);

    ctx.fillStyle = "#444";
    ctx.fillText(`Hint: ${state.hintEnabled ? "ON" : "OFF"}`, 12, 52);
  }

  return {
    onResize() {
      resizeToDisplaySize();
    },
    render() {
      resizeToDisplaySize();
      renderDebug();
    },
    dispose() {
      // 今は特になし
    },
  };
}

