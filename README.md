# Web Mini Games Collection 🎮

ブラウザですぐに遊べる本格パズルゲームのコレクションです。
インストール不要、スマートフォン・PC両対応！

---

## 🌟 収録ゲーム

### 1. 🔢 ナンプレ (数独 / Sudoku Master)
- **特徴**: バックトラッキング法による自動問題生成（一意解保証）。
- **難易度**: 初級 / 中級 / 上級 / エキスパート の4段階。
- **機能**: メモ（鉛筆）モード、Undo/Redo、入力ミス検知、ヒント機能、クリア時の紙吹雪演出。
- **プレイURL**: `./sudoku/index.html`

### 2. 🚗 ラッシュアワー (Rush Hour Master)
- **特徴**: 混雑した駐車場から赤い車を脱出させる大人気スライディングパズル。
- **難易度**: 全10ステージ収録（初級〜エキスパート）。
- **機能**: マウスドラッグ＆スマホスワイプ対応、三ツ星評価（★★★）、幅優先探索（BFS）による次の一手ヒント、脱出ドライブアウトアニメーション。
- **プレイURL**: `./rush-hour/index.html`

---

## 🚀 GitHub Pages での公開手順（Webで遊べるようにする方法）

このリポジトリは GitHub Pages を有効化するだけで、世界中どこからでもブラウザでアクセスできるようになります！

1. GitHub リポジトリ（ `https://github.com/bito999p-ctrl/minigame` ）を開きます。
2. 上部メニューの **「Settings」**（設定）をクリックします。
3. 左サイドバーの **「Pages」** をクリックします。
4. **「Build and deployment」** の **「Branch」** 設定で：
   - ブランチを `main`（または `master`）に選択
   - フォルダを `/ (root)` のままにして **「Save」** をクリックします。
5. 1〜2分待つと、画面上部に公開URL（例: `https://bito999p-ctrl.github.io/minigame/`）が表示されます。そのURLを開くだけでいつでも遊べます！

---

## 🛠 技術スタック
- **Frontend**: HTML5, CSS3 (Modern Glassmorphism & Responsive Grid), Vanilla JavaScript (ES6+)
- **Algorithms**:
  - バックトラッキング法（数独盤面生成・解法探索・一意解保証）
  - 幅優先探索 BFS（ラッシュアワー最短手数探索・ヒント生成）
- **Dependencies**: 外部ライブラリ依存ゼロ（完全オフライン動作可能）
