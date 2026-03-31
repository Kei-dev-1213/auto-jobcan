import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import { BrowserOperator } from "./BrowserOperator";

// Puppeteerのモック
const mockClick = mock(() => Promise.resolve());
const mockType = mock(() => Promise.resolve());
const mockGoto = mock(() => Promise.resolve());
const mockWaitForSelector = mock(() => Promise.resolve());
const mockEvaluate = mock(() => Promise.resolve(false));
const mockNewPage = mock(() =>
  Promise.resolve({
    goto: mockGoto,
    click: mockClick,
    type: mockType,
    waitForSelector: mockWaitForSelector,
    evaluate: mockEvaluate,
  }),
);
const mockClose = mock(() => Promise.resolve());

mock.module("puppeteer", () => ({
  default: {
    launch: mock(() =>
      Promise.resolve({
        newPage: mockNewPage,
        close: mockClose,
      }),
    ),
  },
}));

describe("BrowserOperator", () => {
  let browser: BrowserOperator;

  beforeEach(async () => {
    // モックをリセット
    mockClick.mockClear();
    mockType.mockClear();
    mockGoto.mockClear();
    mockWaitForSelector.mockClear();
    mockEvaluate.mockClear();
    mockNewPage.mockClear();
    mockClose.mockClear();

    browser = await BrowserOperator.create();
  });

  describe("create", () => {
    test("BrowserOperatorインスタンスを生成する", () => {
      expect(browser).toBeInstanceOf(BrowserOperator);
    });

    test("初期化時にブラウザが起動される", () => {
      // mock.moduleで作成されたモックはcreate()内で呼ばれた
      // newPageが呼ばれたことでlaunchが成功したことを間接的に確認
      expect(mockNewPage).toHaveBeenCalled();
    });

    test("初期化時に新しいページが作成される", () => {
      expect(mockNewPage).toHaveBeenCalled();
    });

    test("初期化時にJobcanのログインページが開かれる", () => {
      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/login/mb-employee-global?redirect_to=%2Fm%2Findex",
      );
    });
  });

  describe("finalize", () => {
    test("ブラウザを閉じる", () => {
      browser.finalize();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    test("会社ID、メール、パスワードを入力してログインする", async () => {
      // 環境変数を設定
      process.env.JOBCAN_AUTH_COMPANY = "test-company";
      process.env.JOBCAN_AUTH_EMAIL = "test@example.com";
      process.env.JOBCAN_AUTH_PASSWORD = "test-password";

      await browser.login();

      // セレクタの待機
      expect(mockWaitForSelector).toHaveBeenCalledWith("#client_id");
      expect(mockWaitForSelector).toHaveBeenCalledWith("#email");
      expect(mockWaitForSelector).toHaveBeenCalledWith("#password");

      // フォーム入力
      expect(mockType).toHaveBeenCalledWith("#client_id", "test-company");
      expect(mockType).toHaveBeenCalledWith("#email", "test@example.com");
      expect(mockType).toHaveBeenCalledWith("#password", "test-password");

      // ログインボタンクリック
      expect(mockClick).toHaveBeenCalledWith(
        "body > div.login-content > div > div > form > div:nth-child(6) > button",
      );

      // クリーンアップ
      delete process.env.JOBCAN_AUTH_COMPANY;
      delete process.env.JOBCAN_AUTH_EMAIL;
      delete process.env.JOBCAN_AUTH_PASSWORD;
    });
  });

  describe("openSpecificDatePage", () => {
    test("指定日付の勤怠ページを開く", async () => {
      await browser.openSpecificDatePage("20250201");

      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=20250201",
      );
    });
  });

  describe("openSpecificDateEditPage", () => {
    test("指定日付の編集ページを開く", async () => {
      await browser.openSpecificDateEditPage("20250201");

      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=20250201&_m=edit",
      );
    });
  });

  describe("isStamped", () => {
    test("打刻済みの場合trueを返す", async () => {
      // 「出退勤がありません。」が含まれない = 打刻済み
      mockEvaluate.mockResolvedValueOnce(false);

      const result = await browser.isStamped("20250201");

      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=20250201",
      );
      expect(result).toBe(true);
    });

    test("未打刻の場合falseを返す", async () => {
      // 「出退勤がありません。」が含まれる = evaluate内でtrueが返される
      // isStampedはevaluateの否定の否定でfalseを返す
      // evaluateが"出退勤がありません。"を含む→true、!true = false、falseなのでreturn false
      mockEvaluate.mockResolvedValueOnce(true);

      const result = await browser.isStamped("20250201");
      expect(result).toBe(false);
    });
  });

  describe("isFutureDate", () => {
    test("未来日の場合trueを返す", async () => {
      // 「この日付は打刻修正できません。」が含まれる
      mockEvaluate.mockResolvedValueOnce(true);

      const result = await browser.isFutureDate("20251231");

      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=20251231&_m=edit",
      );
      expect(result).toBe(true);
    });

    test("過去日の場合falseを返す", async () => {
      mockEvaluate.mockResolvedValueOnce(false);

      const result = await browser.isFutureDate("20250101");
      expect(result).toBe(false);
    });
  });

  describe("stamp", () => {
    test("開始時刻と終了時刻を入力して打刻する", async () => {
      await browser.stamp("20250201", "0900", "1800");

      // 編集ページを開く
      expect(mockGoto).toHaveBeenCalledWith(
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=20250201&_m=edit",
      );

      // 時刻入力
      expect(mockWaitForSelector).toHaveBeenCalledWith("#time1");
      expect(mockType).toHaveBeenCalledWith("#time1", "0900");
      expect(mockWaitForSelector).toHaveBeenCalledWith("#time2");
      expect(mockType).toHaveBeenCalledWith("#time2", "1800");

      // 送信
      expect(mockClick).toHaveBeenCalledWith(
        "#container > div:nth-child(7) > form > input[type=submit]:nth-child(11)",
      );
    });
  });
});
