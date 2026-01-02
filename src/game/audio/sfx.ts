let unlocked = false;

export function createSfx() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

  const load = async (path: string) => {
    const res = await fetch(import.meta.url.replace("/sfx.ts", "") + path);
    const buf = await res.arrayBuffer();
    return await ctx.decodeAudioData(buf);
  };

  const buffers: Record<string, AudioBuffer> = {};

  const play = (key: string, volume = 1) => {
    if (!unlocked) return;
    const src = ctx.createBufferSource();
    src.buffer = buffers[key];
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
  };

  return {
    async init() {
      buffers.pellet = await load("assets/audio/sfx/eat_pellet.wav");
      buffers.kana   = await load("assets/audio/sfx/get_kana.wav");
      buffers.clear  = await load("assets/audio/sfx/clear.wav");
    },

    unlock() {
      if (unlocked) return;
      ctx.resume();
      unlocked = true;
    },

    pellet() { play("pellet", 0.4); },
    kana()   { play("kana",   0.7); },
    clear()  { play("clear",  1.0); },
  };
}

  
  
  