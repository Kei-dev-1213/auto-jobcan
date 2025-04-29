import puppeteer, { Browser, Page } from "puppeteer";

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
    await this.page!.goto(process.env.JOBCAN_URL!);
  }

  // ログイン
  async login() {
    // 勤怠会社ID
    await this.page!.waitForSelector("#client_id");
    await this.page!.type("#client_id", process.env.COMPANY!);
    // メールアドレス
    await this.page!.waitForSelector("#email");
    await this.page!.type("#email", process.env.EMAIL!);
    // パスワード
    await this.page!.waitForSelector("#password");
    await this.page!.type("#password", process.env.PASSWORD!);

    // ログイン
    await this.page!.click("body > div.login-content > div > div > form > div:nth-child(6) > button");
  }

  // 特定の日付編集ページを開く
  async toSpecificEditPage(date: string) {
    await this.page!.goto(`https://ssl.jobcan.jp/m/work/accessrecord?recordDay=${date}&_m=edit`);
  }

  // 編集対象かどうか
  async isTarget() {
    const isNGMessage = await this.page!.evaluate(() => {
      return document.body.innerText.includes("この日付は打刻修正できません。");
    });

    // 存在しない場合のみ
    if (!isNGMessage) {
      return true;
    }

    return false;
  }

  async regist(sTime: string, fTime: string) {
    // 開始時刻
    await this.page!.waitForSelector("#time1");
    await this.page!.type("#time1", sTime);
    // 終了時刻
    await this.page!.waitForSelector("#time2");
    await this.page!.type("#time2", fTime);
    // 打刻
    await this.page!.click("#container > div:nth-child(7) > form > input[type=submit]:nth-child(11)");
  }
}
