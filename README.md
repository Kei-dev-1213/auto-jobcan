# auto-jobcan

自動で **ジョブカン（Jobcan）** の打刻処理を実行するための TypeScript スクリプトです。
Google スプレッドシートに記録してある勤務日・開始/終了時刻を読み込み、
Puppeteer でジョブカンのモバイル画面にログインして打刻を行います。

日々の勤怠記録を手動入力する手間を省き、GitHub Actions などの CI で定期実行することを想定しています。

## 必要条件 📦

- [Bun](https://bun.sh/) v1.1.18 以上（`bun` コマンドで実行します）
- Node.js がインストールされていること（Bun の内部で使用）
- Google スプレッドシートへのアクセス権（サービスアカウント）
- ジョブカンのモバイル版ログイン情報（会社 ID / メール / パスワード）

※ GitHub Actions などで動かす場合は、上記をシークレットとして登録してください。

## インストール

依存関係をインストールするには、以下のコマンドを実行してください。

```bash
bun install
```

## 実行方法 🚀

### 依存関係のインストール

```bash
bun install
```

### 手動で実行する

```bash
# 現在年月のシートを処理
bun run index.ts

# 引数で対象年月を指定（例: 202502）
bun run index.ts 202502
```

処理対象シートのタイトルは `YYYYMM` の形式（例: `202502`）である必要があります。

### GitHub Actions から実行する

付属のワークフロー (`.github/workflows/*.yml`) を利用します。
環境変数は `secrets` に設定しておき、月初や月末に自動で打刻できます。

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
├── class/                          # 主要ロジック
│   ├── BrowserOperator.ts          # Puppeteer で Jobcan を操作
│   ├── SpreadSheetOperator.ts      # Google スプレッドシート読み取り
├── util/                           # 共通ユーティリティ
│   └── index.ts
├── index.ts                        # エントリポイント
├── package.json                    # Bun/Node 依存管理
├── tsconfig.json                   # TypeScript 設定
└── .github/
	└── workflows/                 # GitHub Actions ワークフロー定義
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

- `workflow-batch.yml` … 実行時の年月シート（`YYYYMM`）を処理
- `workflow-batch-last-month.yml` … 前月のシートを指定して処理

いずれも実行時に同様の環境変数が必要です。

サンプル ジョブ:

```yaml
jobs:
	stamp:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v3
			- name: Setup Bun
				run: bun install
			- name: Run auto-jobcan
				run: bun run index.ts
				env:
					AUTH_GOOGLE_SHEET_ID: ${{ secrets.AUTH_GOOGLE_SHEET_ID }}
					AUTH_GOOGLE_EMAIL: ${{ secrets.AUTH_GOOGLE_EMAIL }}
					AUTH_GOOGLE_KEY: ${{ secrets.AUTH_GOOGLE_KEY }}
					JOBCAN_AUTH_COMPANY: ${{ secrets.JOBCAN_AUTH_COMPANY }}
					JOBCAN_AUTH_EMAIL: ${{ secrets.JOBCAN_AUTH_EMAIL }}
					JOBCAN_AUTH_PASSWORD: ${{ secrets.JOBCAN_AUTH_PASSWORD }}
```

## ライセンス 📄

MIT License

---

ご自由にお使いください。バグ報告や機能追加のプルリクエストも歓迎します。
