# QuoteShare

セリフを作って PNG 画像としてダウンロードできる、学習用のシンプルなフロントエンドアプリです。
**HTML + CSS + JavaScript** だけで動きます。

- 入力したセリフを 1080×1080 の画像にして PNG ダウンロード
- 背景色、文字色を選んでリアルタイムに Canvas プレビュー
- 外部 API、クラウド連携、保存、ギャラリー、シェア機能は現状の実装には含みません

---

## 1. ファイル構成

```
Basic_SaaS/
├── README.md                # 本ファイル(仕様 + 実装メモ)
├── package.json             # npm scripts
├── scripts/
│   └── dev-server.mjs       # Node.js 開発サーバー
└── public/
    ├── index.html           # 画面
    ├── styles/
    │   └── style.css        # アプリ用スタイル
    └── scripts/
        └── app.js           # 全機能(Canvas / Download / UI)
```

---

## 2. クイックスタート

ビルドツール不要です。Node.js の簡易サーバーで `public/` を配信してブラウザで開きます。

```bash
cd Basic_SaaS
npm run dev
# → http://127.0.0.1:5500
```

VS Code なら **Live Server** 拡張で `public/index.html` を開くだけでも OK。

---

## 3. 仕様

### 3.1 機能一覧

| ID | 機能 | 概要 |
|----|------|------|
| F-01 | セリフ入力 | 本文・著者を入力 |
| F-02 | プレビュー | 入力に応じてリアルタイムで Canvas 描画 |
| F-03 | デザイン設定 | 背景色 / 文字色 |
| F-04 | PNG 書き出し | Canvas → PNG ダウンロード (1080×1080) |

### 3.2 受け入れ基準
- [ ] セリフ・著者を入力するとプレビューが即時更新される
- [ ] PNG ダウンロードで 1080×1080 画像が保存できる
- [ ] スマホ幅ではプレビューとフォームが 1 カラムで表示される

---

## 4. 実装メモ

現状のコードベースで使っている技術は、静的 HTML、CSS Grid、Canvas API、Blob ダウンロードです。

### 4.1 HTML / CSS / JavaScript

#### セマンティック HTML
`public/index.html` は `<header>` / `<main>` / `<section>` / `<footer>` で画面構造を作っています。

#### CSS カスタムプロパティ + Grid
```css
:root { --primary: #6366f1; --radius: 12px; }
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 380px);
  gap: 24px;
}
@media (max-width: 880px) {
  .editor-grid { grid-template-columns: 1fr; }
}
```
スマホでは 1 カラム、デスクトップではプレビューとフォームの 2 カラムに切り替わります。

#### Canvas API
`public/scripts/app.js` の `renderQuote()` がコアです。流れは:
1. `fillRect` で背景を塗る
2. `font` を設定して `measureText` で折り返し位置を計算
3. `fillText` で 1 行ずつ描画
4. `canvas.toBlob()` で PNG バイナリ取得

#### ダウンロード
Canvas を PNG Blob に変換し、ダウンロードリンクから保存します。

```js
canvas.toBlob((blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quote.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}, 'image/png');
```

#### セキュリティ注意
ユーザー入力を画面に出すときは `innerHTML` ではなく `textContent` を使う(XSS 防止)。

---

## 5. 発展アイデア

現状では未実装ですが、次の方向に拡張できます。

- 静的ホスティングにデプロイして公開 URL を持つ
- 背景画像を選べるようにする
- PWA 化してホーム画面に追加可能にする
- 多言語対応(日本語 / 英語切替)を入れる

---

## 6. ライセンス

学習目的の参考実装です。自由に改変・利用してください。
