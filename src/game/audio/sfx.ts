export type Sfx = {
    pellet: () => void;
    kana: () => void;
    clear: () => void;
    unlock: () => void;
    setEnabled: (enabled: boolean) => void;
  };
  
  function baseUrl() {
    // Vite: / または /Kotoba-meiro/ のようなサブパス
    return (import.meta as any).env?.BASE_URL ?? "/";
  }
  
  function urlInPublic(pathFromPublicRoot: string) {
    const base = baseUrl();
    const p = pathFromPublicRoot.replace(/^\/+/, "");
    return `${base}${p}`;
  }
  
  function makeAudio(pathFromPublicRoot: string, volume: number, name: string) {
    const src = urlInPublic(pathFromPublicRoot);
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = volume;
  
    // ロード失敗が見えるようにする
    a.addEventListener("error", () => {
      console.warn(`[sfx] failed to load: ${name}`, src, a.error);
    });
  
    try {
      a.load();
    } catch {
      // ignore
    }
    return a;
  }
  
  export function createSfx(): Sfx {
    // ★あなたの配置に合わせる
    const aPellet = makeAudio("assets/audio/sfx/eat_pellet.wav", 0.35, "pellet");
    const aKana = makeAudio("assets/audio/sfx/get_kana.wav", 0.6, "kana");
    const aClear = makeAudio("assets/audio/sfx/clear.wav", 0.8, "clear");
  
    let enabled = true;
    let unlocked = false;
  
    const play = (a: HTMLAudioElement, label: string) => {
      if (!enabled) return;
      try {
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof (p as any).catch === "function") {
          (p as Promise<void>).catch((err) => {
            console.warn(`[sfx] play blocked/failed: ${label}`, err);
          });
        }
      } catch (err) {
        console.warn(`[sfx] play threw: ${label}`, err);
      }
    };
  
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
  
      // iOS/Chrome対策：超小音で一瞬再生→停止
      const a = aPellet;
      const prevVol = a.volume;
      a.volume = 0.001;
  
      try {
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof (p as any).then === "function") {
          (p as Promise<void>)
            .then(() => {
              try {
                a.pause();
                a.currentTime = 0;
              } catch {}
            })
            .finally(() => {
              a.volume = prevVol;
            });
        } else {
          a.volume = prevVol;
        }
      } catch {
        a.volume = prevVol;
      }
    };
  
    return {
      pellet: () => play(aPellet, "pellet"),
      kana: () => play(aKana, "kana"),
      clear: () => play(aClear, "clear"),
      unlock,
      setEnabled: (v) => (enabled = v),
    };
  }
  
  
  