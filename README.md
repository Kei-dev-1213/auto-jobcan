# auto-jobcan

## 必要条件

- Bun v1.1.18 以上
- Node.js 環境
- Google スプレッドシートの認証情報
- ジョブカンのログイン情報

## インストール

依存関係をインストールするには、以下のコマンドを実行してください。

```bash
bun install
```

## 実行方法

以下のコマンドでスクリプトを実行できます。

```bash
bun run index.ts
```

特定の年月を指定して実行する場合は、以下のように引数を渡してください。

```bash
bun run index.ts YYYYMM
```

## 環境変数

以下の環境変数を設定する必要があります。

**Google スプレッドシート認証情報**

- `AUTH_GOOGLE_EMAIL`: Google サービスアカウントのメールアドレス
- `AUTH_GOOGLE_KEY`: Google サービスアカウントの秘密鍵

**ジョブカン認証情報**

- `JOBCAN_AUTH_COMPANY`: ジョブカンの会社 ID
- `JOBCAN_AUTH_EMAIL`: ジョブカンのログインメールアドレス
- `JOBCAN_AUTH_PASSWORD`: ジョブカンのログインパスワード

## プロジェクト構成

```
.
├── class/
│   ├── BrowserOperator.ts          # ジョブカンのブラウザ操作を担当
│   ├── SpreadSheetOperator.ts      # Googleスプレッドシート操作を担当
├── util/
│   ├── index.ts                    # ユーティリティ関数
├── index.ts                        # メインスクリプト
├── package.json                    # プロジェクト設定
├── tsconfig.json                   # TypeScript設定
├── .github/
│   └── workflows/
│       ├── workflow-batch.yml
│       ├── workflow-batch-last-month.yml
```

## GitHub Actions

このプロジェクトには、以下の GitHub Actions ワークフローが含まれています。

- `workflow-batch.yml`: 現在の月のデータを処理するワークフロー
- `workflow-batch-last-month.yml`: 前月のデータを処理するワークフロー

## ライセンス

MIT License
