import puppeteer, { Browser, Page } from "puppeteer";
import { CONSTANTS } from "./Constants";

export class BrowserOperator {
  private browser: Browser | undefined;
  private page: Page | undefined;

  private constructor() {}

  static async create(): Promise<BrowserOperator> {
    const instance = new BrowserOperator();
    await instance.initialize();
    return instance;
  }

  // 初期化処理
  private async initialize() {
    try {
      // this.browser = await puppeteer.launch({ headless: false, slowMo: 50 });
      this.browser = await puppeteer.launch({
        slowMo: 50,
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // サンドボックス無効化
      });
      this.page = await this.browser.newPage();
      await this._loadPage();
    } catch (e) {
      console.error("BrowserOperatorの初期化中にエラーが発生しました:", e);
      throw new Error("BrowserOperator初期処理でエラー");
    }
  }

  // 終了処理
  finalize() {
    this.browser!.close();
  }

  private async _loadPage() {
    await this.page!.goto(CONSTANTS.URL.JOBCAN.TOP);
  }

  // ログイン
  async login() {
    // 勤怠会社ID
    await this.page!.waitForSelector(CONSTANTS.SELECTORS.INPUT.COMPANY_ID);
    await this.page!.type(
      CONSTANTS.SELECTORS.INPUT.COMPANY_ID,
      process.env.JOBCAN_AUTH_COMPANY!,
    );
    // メールアドレス
    await this.page!.waitForSelector(CONSTANTS.SELECTORS.INPUT.EMAIL);
    await this.page!.type(
      CONSTANTS.SELECTORS.INPUT.EMAIL,
      process.env.JOBCAN_AUTH_EMAIL!,
    );
    // パスワード
    await this.page!.waitForSelector(CONSTANTS.SELECTORS.INPUT.PASSWORD);
    await this.page!.type(
      CONSTANTS.SELECTORS.INPUT.PASSWORD,
      process.env.JOBCAN_AUTH_PASSWORD!,
    );

    // ログイン
    await this.page!.click(CONSTANTS.SELECTORS.BUTTON.LOGIN);
  }

  // 特定の日付ページを開く
  async openSpecificDatePage(date: string) {
    await this.page!.goto(
      `${CONSTANTS.URL.JOBCAN.SPECIFIC_DATE_PREFIX}${date}`,
    );
  }

  // 特定の日付編集ページを開く
  async openSpecificDateEditPage(date: string) {
    await this.page!.goto(
      `${CONSTANTS.URL.JOBCAN.SPECIFIC_DATE_PREFIX}${date}${CONSTANTS.URL.JOBCAN.SPECIFIC_DATE_SUFFIX}`,
    );
  }

  // 打刻済かどうか
  async isStamped(_date: string) {
    // 編集画面を開く
    await this.openSpecificDatePage(_date);

    // 特定文言の有無
    if (
      !(await this.page!.evaluate(() => {
        return document.body.innerText.includes(
          CONSTANTS.MESSAGES.NO_WORK_MESSAGE,
        );
      }))
    ) {
      return true;
    }

    return false;
  }

  // 未来日かどうか
  async isFutureDate(_date: string) {
    // 編集画面を開く
    await this.openSpecificDateEditPage(_date);

    // 特定文言の有無
    if (
      await this.page!.evaluate(() => {
        return document.body.innerText.includes(
          CONSTANTS.MESSAGES.CANNOT_MODIFY_MESSAGE,
        );
      })
    ) {
      return true;
    }

    return false;
  }

  // 打刻
  async stamp(date: string, sTime: string, fTime: string) {
    // 日付編集画面を開く
    await this.openSpecificDateEditPage(date);

    // 開始時刻
    await this.page!.waitForSelector(CONSTANTS.SELECTORS.INPUT.START_TIME);
    await this.page!.type(CONSTANTS.SELECTORS.INPUT.START_TIME, sTime);
    // 終了時刻
    await this.page!.waitForSelector(CONSTANTS.SELECTORS.INPUT.FINISH_TIME);
    await this.page!.type(CONSTANTS.SELECTORS.INPUT.FINISH_TIME, fTime);
    // 打刻
    await this.page!.click(CONSTANTS.SELECTORS.BUTTON.STAMP);
  }
}
