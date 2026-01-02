let unlocked = false;

export function createSfx() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  const load = async (path: string) => {
    // Viteのサブパス配信（/Kotoba-meiro/）対策：BASE_URL を必ず使う
    const base = (import.meta as any).env?.BASE_URL ?? "/";
    const url = base + path.replace(/^\/+/, "");

    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[sfx] fetch failed:", res.status, url);
      throw new Error(`sfx fetch failed: ${res.status} ${url}`);
    }
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
  };

  const buffers: Record<string, AudioBuffer> = {};
  let ready = false;

  const play = (key: string, volume = 1) => {
    if (!unlocked || !ready) return;
    if (!buffers[key]) return;
    const src = ctx.createBufferSource();
    src.buffer = buffers[key];
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
  };

  return {
    async init() {
        try {
                    buffers.pellet = await load("assets/audio/sfx/eat_pellet.wav");
                    buffers.kana   = await load("assets/audio/sfx/get_kana.wav");
                    buffers.clear  = await load("assets/audio/sfx/clear.wav");
                    ready = true;
                    // console.log("[sfx] loaded");
                  } catch (e) {
                    console.warn("[sfx] init failed", e);
                    ready = false;
                  }
    },

    unlock() {
      if (unlocked) return;
      // resume は Promise。環境によって await が必要
      ctx.resume()
        .then(() => {
          unlocked = true;
          // console.log("[sfx] unlocked");
        })
        .catch((e) => {
          console.warn("[sfx] unlock failed", e);
        });
    },

    pellet() { play("pellet", 0.4); },
    kana()   { play("kana",   0.7); },
    clear()  { play("clear",  1.0); },
  };
}

  
  
  