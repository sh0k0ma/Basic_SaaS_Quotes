# QuoteShare

名言を作って Instagram にシェアできる、学習用のシンプルな SaaS。
**HTML + CSS + JavaScript** だけで動き、**API** と **クラウド** の考え方も学べる構成です。

- 入力した名言を 1080×1080 の画像にして PNG ダウンロード
- Web Share API で Instagram などに共有(非対応端末はダウンロード)
- LocalStorage に保存してギャラリーで再編集・削除

---

## 1. ファイル構成

```
Basic_SaaS/
├── README.md                # 本ファイル(仕様 + 学習ガイド)
└── public/
    ├── index.html           # 画面
    ├── styles/
    │   └── style.css        # スタイル(reset + theme)
    └── scripts/
        └── app.js           # 全機能(Canvas / Storage / Share / UI)
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

## 3. 仕様(MVP)

### 3.1 機能一覧

| ID | 機能 | 概要 |
|----|------|------|
| F-01 | 名言入力 | 本文・著者を入力 |
| F-02 | プレビュー | 入力に応じてリアルタイムで Canvas 描画 |
| F-03 | デザイン選択 | テンプレート / 背景色 / 文字色 |
| F-04 | PNG 書き出し | Canvas → PNG ダウンロード (1080×1080) |
| F-05 | ローカル保存 | LocalStorage に永続化 |
| F-06 | ギャラリー | 保存した名言を一覧 / 編集 / 削除 |
| F-07 | シェア | Web Share API でシェア(非対応時はダウンロード) |

### 3.2 受け入れ基準
- [ ] テキスト・著者を入力するとプレビューが即時更新される
- [ ] PNG ダウンロードで 1080×1080 画像が保存できる
- [ ] LocalStorage に 10 件以上保存して再表示できる
- [ ] モバイル Chrome / Safari で「シェア」から Instagram アプリへ画像を渡せる

### 3.3 データモデル(LocalStorage)
キー: `quoteshare.quotes` に下記オブジェクトの配列を JSON 保存。

```ts
{
  id: string;          // UUID
  text: string;        // 本文
  author: string;      // 著者
  template: 'minimal' | 'serif' | 'bold';
  bg: string;          // 背景色 HEX
  fg: string;          // 文字色 HEX
  thumbnail: string;   // 300x300 JPEG dataURL
  createdAt: string;   // ISO8601
  updatedAt: string;
}
```

---

## 4. 学習ガイド

本サービスはフロントエンドの基礎技術に加えて、SaaS を発展させるうえで欠かせない **API** と **クラウド** の考え方を学べるよう設計されています。

### 4.1 Step 1: HTML / CSS / JavaScript

#### セマンティック HTML
`<div>` ではなく `<header>` / `<main>` / `<section>` / `<footer>` を使うと、スクリーンリーダーや検索エンジンに構造が伝わる。

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
スマホでは 1 カラム、デスクトップでは 2 カラム。レスポンシブの基本形。

#### Canvas API
`app.js` の `renderQuote()` がコア。流れは:
1. `fillRect` で背景を塗る
2. `font` を設定して `measureText` で折り返し位置を計算
3. `fillText` で 1 行ずつ描画
4. `canvas.toBlob()` で PNG バイナリ取得

#### LocalStorage
```js
localStorage.setItem('key', JSON.stringify(obj));
const obj = JSON.parse(localStorage.getItem('key'));
```
- 容量はオリジン毎に約 5 MB(画像生データを直接入れると一瞬で溢れる)
- 同期 API なので巨大データはメインスレッドを止める
- プライベートウィンドウでは永続化されない

#### セキュリティ注意
ユーザー入力を画面に出すときは `innerHTML` ではなく `textContent` を使う(XSS 防止)。

---

### 4.2 Step 2: 外部 API を呼び出す

本 MVP は API を使いませんが、SaaS を拡張するなら必須の知識です。

#### fetch + async / await
```js
try {
  const res = await fetch('https://example.com/api/data', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`API エラー: ${res.status}`);
  const data = await res.json();
} catch (err) {
  console.error(err);
}
```
- ネットワーク失敗(オフライン等)は **fetch 自体が reject**
- HTTP エラー(404, 500 等)は **reject しない** ので `if (!res.ok)` を自分で書く

#### よく使うステータスコード
| Code | 意味 |
|------|------|
| 200  | 成功 |
| 400  | リクエスト不正 |
| 401  | 未認証 |
| 403  | 権限なし |
| 404  | 見つからない |
| 429  | レート制限超過 |
| 500  | サーバーエラー |

#### CORS — 最大のハマりどころ
ブラウザは別オリジンの fetch をデフォルトで制限する。サーバーが
```
Access-Control-Allow-Origin: *
```
を返さないと JS からレスポンスを読めない。`mode: 'no-cors'` は解決策ではない(レスポンスを取れず空になるだけ)。
解決策は **CORS 許可された API を使う** か、自前サーバー(後述の BFF)経由でプロキシすること。

#### API キーをフロントに置かない
ブラウザの JS は誰でも読める。API キーを直書きすると悪用される。
```
[Browser] → [自分のサーバー関数 (API_KEY 保持)] → [外部 API]
```
この薄いサーバー層を **BFF (Backend For Frontend)** と呼ぶ。

---

### 4.3 Step 3: クラウド

| 種類 | サービス例 | 用途 |
|------|-----------|------|
| 静的ホスティング | Firebase Hosting / Cloudflare Pages / Vercel | HTML/CSS/JS を世界配信 |
| 認証 | Firebase Authentication / Auth0 | Google ログイン等 |
| データベース | Cloud Firestore / Supabase | クラウド側にデータ保存・同期 |
| サーバーレス関数 | Cloud Functions / Cloudflare Workers | API キーを隠す BFF |

#### 静的ホスティングの基本フロー(例: Firebase)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public ディレクトリを選択
firebase deploy
```
数十秒で `https://<project>.web.app` に公開される。

#### クラウド DB 利用時に必須なこと
**セキュリティルール** を必ず書く。例(Firestore):
```
match /users/{uid}/quotes/{doc} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
これを書かないと **全世界が読み書き可能** になる。

#### サーバーレス関数で API キーを守る
```js
// 擬似コード
export const proxy = onRequest(async (req, res) => {
  const r = await fetch('https://external.example.com', {
    headers: { Authorization: `Bearer ${process.env.SECRET_KEY}` },
  });
  res.json(await r.json());
});
```
キーはサーバー側だけに存在し、フロントには出ない。

#### コスト感
個人開発の範囲では基本ゼロ円(無料枠で十分)。本番運用するなら **予算アラート** を必ず設定。

---

## 5. 発展アイデア

- Firebase Hosting にデプロイして公開 URL を持つ
- Google ログインを足してクラウド同期 (Firestore)
- 背景画像を Unsplash API から取得 (Cloud Functions 経由でキーを隠す)
- PWA 化してホーム画面に追加可能にする
- 多言語対応 (日本語 / 英語切替)

---

## 6. ライセンス

学習目的の参考実装です。自由に改変・利用してください。
