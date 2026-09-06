# カタログ発注サイト（OSSTEM JAPAN 営業向け）

Google スプレッドシートをDB兼管理画面として使う、社内向けカタログ発注Webアプリです。
ログイン機能はありません（URLを知っていればアクセス可能）。

## 1. セットアップ

```bash
npm install
```

### 1-1. Google サービスアカウントの準備

1. Google Cloud Console でプロジェクトを作成（既存でも可）。
2. 「APIとサービス」→「ライブラリ」から **Google Sheets API** を有効化。
3. 「IAMと管理」→「サービスアカウント」で新規サービスアカウントを作成し、
   鍵（JSON）を発行してダウンロード。
4. 対象のGoogleスプレッドシートを開き、サービスアカウントのメールアドレス
   （`xxxx@xxxx.iam.gserviceaccount.com`）を **編集者** として共有する。

### 1-2. 環境変数の設定

`.env.example` を `.env.local` にコピーし、ダウンロードしたJSONの値を転記してください。

```bash
cp .env.example .env.local
```

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` … JSONの `client_email`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` … JSONの `private_key`（改行 `\n` はそのままでOK）
- `GOOGLE_SHEET_ID` … スプレッドシートのURL `https://docs.google.com/spreadsheets/d/【この部分】/edit` の値

Vercelにデプロイする場合は、同じ3つをVercelプロジェクトの環境変数に設定してください。

### 1-3. スプレッドシートの準備

1つのスプレッドシートに、以下3つのシートをこの名前で作成してください（シート名・列順は固定）。

**`catalog_master`**（1行目はヘッダー、2行目以降がデータ）

| A: product_id | B: catalog_name | C: image_url | D: stock_quantity | E: order_unit | F: max_order_per_time | G: next_arrival_date | H: display_order | I: sales_status |
|---|---|---|---|---|---|---|---|---|
| C001 | Product Catalog | https://... | 100 | 10 | 50 | 2026/09/20 | 1 | on_sale |

- `sales_status` はアプリ側が読み込み時に自動計算して書き戻します（手動編集しても上書きされます）。

**`branch_master`**

| A: branch_name |
|---|
| 東京支店 |

**`order_history`**（アプリが自動で追記します。手動で列見出しだけ用意しておいてください）

| A: order_datetime | B: branch_name | C: staff_name | D: product_id | E: catalog_name | F: quantity | G: note |
|---|---|---|---|---|---|---|

## 2. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 で確認できます。

## 3. デプロイ（Vercel想定）

1. GitHubなどにリポジトリをpush。
2. Vercelでプロジェクトをインポート。
3. 環境変数（上記3つ）をVercelの Project Settings → Environment Variables に設定。
4. デプロイ。

## 4. 同時発注対策について（重要）

`/lib/orderLock.ts` にコメントで詳しく記載していますが、要点は以下の通りです。

- 発注APIは、確定直前に必ずスプレッドシートから最新在庫を再取得し、その場でチェックしてから
  在庫を減算します（`/app/api/orders/route.ts`）。
- 同一サーバーインスタンス内では、商品IDごとのメモリ内ロック（`async-mutex`）で
  在庫チェック〜減算の区間を直列化しています。
- **ただし** Vercelのようなサーバーレス環境では複数インスタンスが並行起動し得るため、
  メモリ内ロックだけでは複数インスタンスをまたいだ同時実行までは防げません。
  アクセス数が多く厳密な排他制御が必要な場合は、Redis や Vercel KV などの
  外部ストレージを使った分散ロックへの置き換えを推奨します
  （`withProductLocks` の中身を差し替えるだけで済むようにしてあります）。

## 5. 主な仕様の要点

- 在庫数・サイズ・重量はカタログ一覧に表示しません（APIも生の在庫数は返しません）。
- 数量は直接入力不可、＋／−ボタンのみ（`order_unit` 単位）。
- 発注確認画面はなく、「発注する」ボタンで即時処理します。
- 在庫不足の商品が1つでもあれば、発注全体を確定せずエラーを返します（部分確定なし）。
