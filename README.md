# auto-jobcan

自動で **ジョブカン（Jobcan）** の打刻処理を実行するための TypeScript スクリプトです。
Google スプレッドシートに記録してある勤務日・開始/終了時刻を読み込み、
Puppeteer でジョブカンのモバイル画面にログインして打刻を行います。

日々の勤怠記録を手動入力する手間を省き、GitHub Actions などの CI で定期実行することを想定しています。

## 必要条件 📦

- [Bun](https://bun.sh/) v1.1.18 以上（`bun` コマンドで実行します）
- Google スプレッドシートへのアクセス権（サービスアカウント）
- ジョブカンのモバイル版ログイン情報（会社 ID / メール / パスワード）

※ GitHub Actions などで動かす場合は、上記をシークレットとして登録してください。

## インストール

依存関係をインストールするには、以下のコマンドを実行してください。

```bash
bun install
```

## 実行方法 🚀

### 手動で実行する

```bash
# 現在年月のシートを処理
bun run index.ts

# 引数で対象年月を指定（例: 202502）
bun run index.ts 202502
```

処理対象シートのタイトルは `YYYYMM` の形式（例: `202502`）である必要があります。

### テストの実行

```bash
bun test
```

### GitHub Actions から実行する

付属のワークフロー (`.github/workflows/*.yml`) を利用します。
環境変数は `secrets` に設定しておき、毎日または月初に自動で打刻できます。

## 環境変数 🔐

### Google スプレッドシート認証

- `AUTH_GOOGLE_SHEET_ID` … 対象スプレッドシートの ID
- `AUTH_GOOGLE_EMAIL` … サービスアカウントのメールアドレス
- `AUTH_GOOGLE_KEY` … サービスアカウントの秘密鍵（改行は `\n` でエスケープ）

### ジョブカン認証

- `JOBCAN_AUTH_COMPANY` … 勤怠会社 ID
- `JOBCAN_AUTH_EMAIL` … ログイン用メールアドレス
- `JOBCAN_AUTH_PASSWORD` … パスワード

各値は `process.env` から読み込まれ、そのまま Puppeteer のフォーム入力に使われます。
キー名を間違えないように注意してください。

## ディレクトリ構成 🔧

```
auto-jobcan/
├── class/                              # 主要ロジック
│   ├── BrowserOperator.ts              # Puppeteer で Jobcan を操作
│   ├── BrowserOperator.test.ts         # BrowserOperator のテスト
│   ├── SpreadSheetOperator.ts          # Google スプレッドシート読み取り
│   └── SpreadSheetOperator.test.ts     # SpreadSheetOperator のテスト
├── util/                               # 共通ユーティリティ
│   ├── index.ts
│   └── index.test.ts                   # ユーティリティのテスト
├── index.ts                            # エントリポイント
├── index.test.ts                       # メイン処理フローのテスト
├── package.json                        # Bun 依存管理
├── tsconfig.json                       # TypeScript 設定
└── .github/
    └── workflows/                      # GitHub Actions ワークフロー定義
        ├── workflow-batch.yml
        └── workflow-batch-last-month.yml
```

### シートの想定フォーマット

対象スプレッドシートは以下のような列構成を想定しています。

| 日付       | 開始時間 | 終了時間 |
| ---------- | -------- | -------- |
| 2025-02-01 | 9:00     | 18:00    |

各値は `SpreadSheetOperator` が縦方向（列）に読み込み、空白行は無視します。
日付は `YYYY-MM-DD`、時間は `HH:MM` 形式で記録してください。

## GitHub Actions 🤖

ワークフローは 2 種類あります。

- `workflow-batch.yml` … 毎日午前5時（JST）に現在月のシート（`YYYYMM`）を処理
- `workflow-batch-last-month.yml` … 毎月1日・2日に前月のシートを指定して処理

いずれも手動実行（`workflow_dispatch`）にも対応しています。
実行時に同様の環境変数が必要です。

## ライセンス 📄

MIT License

---

ご自由にお使いください。バグ報告や機能追加のプルリクエストも歓迎します。
