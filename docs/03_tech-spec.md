# ことばめいろ｜技術仕様書（Tech Specification）

## 1. 本仕様書の目的

本書は、学習ゲーム「ことばめいろ」の  
**技術構成・データ設計・ゲームループ・更新処理**を定義する。

本作は以下を前提とする。

- Webブラウザで動作する
- PC / タブレット / スマートフォン対応
- 軽量・高速・安定
- 学習配慮を壊さないシンプルな実装

---

## 2. 技術スタック（想定）

### 必須
- JavaScript / TypeScript
- HTML5 Canvas

### 推奨
- TypeScript（型安全・仕様の明文化）
- Vite（開発・ビルド）
- localStorage（セーブ）

※ フレームワーク（React 等）は任意  
※ UI層とゲームエンジン層は分離する

---

## 3. アーキテクチャ概要

UI（画面・遷移）
└─ GameScreen
└─ GameEngine
├─ GameState
├─ InputManager
├─ Maze
├─ EntitySystem
├─ HintSystem
└─ Renderer

markdown
コードをコピーする

- **UI層**：画面遷移・ボタン
- **GameEngine**：1フレームごとの更新と描画
- **GameState**：すべての状態の唯一の真実源

---

## 4. ゲームループ設計

### 4.1 基本ループ

- requestAnimationFrame ベース
- 固定フレームレートを仮定しない
- ロジックは **マス単位**で進行

```ts
function gameLoop(timestamp) {
  input.update()
  engine.update(deltaTime)
  engine.render(ctx)
  requestAnimationFrame(gameLoop)
}
4.2 update / render の責務分離
update
入力反映

キャラ移動

衝突判定

文字取得判定

ステージ進行

render
背景（迷路）

キャラクター

ゴースト

UI（ヒント表示）

5. GameState 設計
5.1 GameState 構造（例）
ts
コードをコピーする
type GameState = {
  level: number
  stageIndex: number

  maze: MazeState
  player: PlayerState
  ghosts: GhostState[]

  letters: LetterItemState[]
  currentLetterIndex: number

  hintEnabled: boolean

  phase: "playing" | "pause" | "clear"
  timers: {
    freeze?: number
  }
}
5.2 原則
GameState は 直接書き換えない

update 関数経由でのみ変更

render は読み取り専用

6. 入力管理（InputManager）
6.1 共通仕様
キーボード / タッチを統合

出力は「現在の方向」1つのみ

ts
コードをコピーする
type Direction = "up" | "down" | "left" | "right" | null
6.2 InputManager API
ts
コードをコピーする
class InputManager {
  getDirection(): Direction
  update(): void
}
押しっぱなし可

同時入力は「最後に入力された方向」を採用

無効入力は無視（エラーを出さない）

7. 迷路（Maze）設計
7.1 データ構造
ts
コードをコピーする
type MazeState = {
  grid: string[][]        // '#' or '.'
  width: number
  height: number
}
7.2 テンプレ解析
ASCIIテンプレを使用

analyzeTemplate() により以下を生成：

walkable

near / mid / far

junctions

start

7.3 スポーン確定（spawnPlanner）
Player：near から選択

Letter：

先頭：near

中盤：mid

最後：far

Ghost：

junction or mid

Player から一定距離以上

8. エンティティ設計
8.1 Player
ts
コードをコピーする
type PlayerState = {
  x: number
  y: number
  dir: Direction
  nextDir: Direction
}
マス単位移動

曲がり角で nextDir を自動反映

壁方向入力は保持されるが反映されない

8.2 Ghost
ts
コードをコピーする
type GhostState = {
  x: number
  y: number
  dir: Direction
  mode: "random" | "chase"
}
Lvによって AI 切替

Lv1 は random のみ

Lv3 以降で chase を追加

8.3 LetterItem
ts
コードをコピーする
type LetterItemState = {
  x: number
  y: number
  char: string
  index: number
}
index = 正解順

currentLetterIndex と比較して判定

9. ヒントシステム（HintSystem）
9.1 状態
ts
コードをコピーする
type HintState = {
  enabled: boolean
  flashTimer?: number
}
9.2 ロジック
enabled = true：

常時「次の文字」を表示

enabled = false：

不正解時に flashTimer をセット

render 時に一瞬だけ表示

10. 衝突・判定
10.1 文字取得
Player 座標と Letter 座標が一致したら判定

正解：

currentLetterIndex++

不正解：

一時停止（freeze）

ヒント点灯（OFF時）

10.2 ゴースト接触
接触時：

プレイヤー停止

ゴースト停止

数秒後に再開

※ ゲームオーバーにはしない

11. タイマー管理
freeze / flash は フレームではなく時間（ms）管理

update(delta) で減算

12. レンダリング仕様
12.1 Canvas
1 Canvas

迷路はタイル描画

スケーリングでレスポンシブ対応

12.2 文字描画
フォントは太め・高コントラスト

縁取り or 背景プレートで視認性確保

点滅・回転などの過剰演出は禁止

13. セーブ仕様
13.1 保存先
localStorage

13.2 保存内容
ts
コードをコピーする
type SaveData = {
  level: number
  hintEnabled: boolean
}
14. デバッグ・検証
テンプレ検証ツール：

外周壁

全連結

デバッグ表示（開発用）：

spawn分類

BFS距離

15. 技術的に「やらないこと」
ネットワーク通信

重い物理演算

複雑なアニメーション

ランキング・分析ログ

16. 本仕様の結論
この技術仕様は、

止まらせない

詰まらせない

壊れにくい

ことを最優先に設計されている。

実装はシンプルでよい。
仕様を守れば、体験の質は自然に保たれる。