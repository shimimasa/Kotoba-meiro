export type Sfx = {
    pellet: () => void;
    kana: () => void;
    clear: () => void;
    setEnabled: (enabled: boolean) => void;
  };
  
  export function createSfx(): Sfx {
    // ※ パスはプロジェクト構成に合わせて調整してOK
    const aPellet = new Audio("/assets/sfx/eat_pellet.wav");
    const aKana = new Audio("/assets/sfx/get_kana.wav");
    const aClear = new Audio("/assets/sfx/clear.wav");
  
    // モバイル/ブラウザ対策：少しだけ短めに
    aPellet.volume = 0.35;
    aKana.volume = 0.6;
    aClear.volume = 0.8;
  
    let enabled = true;
  
    const play = (a: HTMLAudioElement) => {
      if (!enabled) return;
      try {
        a.currentTime = 0;
        // play() は user gesture 必須環境があるので、失敗は握りつぶす
        void a.play();
      } catch {
        // ignore
      }
    };
  
    return {
      pellet: () => play(aPellet),
      kana: () => play(aKana),
      clear: () => play(aClear),
      setEnabled: (v) => {
        enabled = v;
      },
    };
  }
  