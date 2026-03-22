import puppeteer, { Browser, Page } from "puppeteer";

const JOBCAN_BASE_URL = "https://ssl.jobcan.jp";
const LOGIN_URL = `${JOBCAN_BASE_URL}/login/mb-employee-global?redirect_to=%2Fm%2Findex`;
const RECORD_URL = (date: string) =>
  `${JOBCAN_BASE_URL}/m/work/accessrecord?recordDay=${date}`;
const RECORD_EDIT_URL = (date: string) =>
  `${JOBCAN_BASE_URL}/m/work/accessrecord?recordDay=${date}&_m=edit`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export class BrowserOperator {
  private browser: Browser;
  private page: Page;

  private constructor(browser: Browser, page: Page) {
    this.browser = browser;
    this.page = page;
  }

  static async create(): Promise<BrowserOperator> {
    try {
      const browser = await puppeteer.launch({
        slowMo: 50,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.goto(LOGIN_URL);
      return new BrowserOperator(browser, page);
    } catch (e) {
      console.error("BrowserOperatorの初期化中にエラーが発生しました:", e);
      throw new Error("BrowserOperator初期処理でエラー");
    }
  }

  // 終了処理
  async finalize(): Promise<void> {
    await this.browser.close();
  }

  // ログイン
  async login(): Promise<void> {
    const { JOBCAN_AUTH_COMPANY, JOBCAN_AUTH_EMAIL, JOBCAN_AUTH_PASSWORD } =
      this.getJobcanCredentials();

    await this.page.waitForSelector("#client_id");
    await this.page.type("#client_id", JOBCAN_AUTH_COMPANY);
    await this.page.waitForSelector("#email");
    await this.page.type("#email", JOBCAN_AUTH_EMAIL);
    await this.page.waitForSelector("#password");
    await this.page.type("#password", JOBCAN_AUTH_PASSWORD);
    await this.page.click('button[type="submit"]');
  }

  // 打刻済かどうか
  async isStamped(date: string): Promise<boolean> {
    await this.page.goto(RECORD_URL(date));
    const bodyText = await this.page.evaluate(() => document.body.innerText);
    return !bodyText.includes("出退勤がありません。");
  }

  // 未来日かどうか
  async isFutureDate(date: string): Promise<boolean> {
    await this.page.goto(RECORD_EDIT_URL(date));
    const bodyText = await this.page.evaluate(() => document.body.innerText);
    return bodyText.includes("この日付は打刻修正できません。");
  }

  // 打刻（リトライ付き）
  async stamp(
    date: string,
    startTime: string,
    finishTime: string,
  ): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.page.goto(RECORD_EDIT_URL(date));
        await this.page.waitForSelector("#time1");
        await this.page.type("#time1", startTime);
        await this.page.waitForSelector("#time2");
        await this.page.type("#time2", finishTime);
        await this.page.click('input[type="submit"]');
        return;
      } catch (e) {
        console.warn(
          `打刻処理に失敗しました（${attempt}/${MAX_RETRIES}回目）: ${date}`,
          e,
        );
        if (attempt === MAX_RETRIES) {
          throw new Error(`打刻処理が${MAX_RETRIES}回失敗しました: ${date}`);
        }
        await this.delay(RETRY_DELAY_MS);
      }
    }
  }

  // 環境変数のバリデーション
  private getJobcanCredentials() {
    const JOBCAN_AUTH_COMPANY = process.env.JOBCAN_AUTH_COMPANY;
    const JOBCAN_AUTH_EMAIL = process.env.JOBCAN_AUTH_EMAIL;
    const JOBCAN_AUTH_PASSWORD = process.env.JOBCAN_AUTH_PASSWORD;

    if (!JOBCAN_AUTH_COMPANY || !JOBCAN_AUTH_EMAIL || !JOBCAN_AUTH_PASSWORD) {
      throw new Error(
        "ジョブカン認証情報の環境変数が不足しています: JOBCAN_AUTH_COMPANY, JOBCAN_AUTH_EMAIL, JOBCAN_AUTH_PASSWORD",
      );
    }

    return { JOBCAN_AUTH_COMPANY, JOBCAN_AUTH_EMAIL, JOBCAN_AUTH_PASSWORD };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
