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
      this.browser = await puppeteer.launch({ headless: false, slowMo: 50 });
      // this.browser = await puppeteer.launch({
      //   slowMo: 50,
      //   args: ["--no-sandbox", "--disable-setuid-sandbox"], // サンドボックス無効化
      // });
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
    console.log(`シートの転記処理が完了しました。`);
  }

  private async _loadPage() {
    await this.page!.goto(process.env.JOBCAN_URL!);
  }

  // ログイン
  async login() {
    // 勤怠会社ID
    await this.page!.waitForSelector("#client_id");
    await this.page!.type("#client_id", process.env.JOBCAN_AUTH_COMPANY!);
    // メールアドレス
    await this.page!.waitForSelector("#email");
    await this.page!.type("#email", process.env.JOBCAN_AUTH_EMAIL!);
    // パスワード
    await this.page!.waitForSelector("#password");
    await this.page!.type("#password", process.env.JOBCAN_AUTH_PASSWORD!);

    // ログイン
    await this.page!.click("body > div.login-content > div > div > form > div:nth-child(6) > button");
  }

  // 特定の日付ページを開く
  async openSpecificDatePage(date: string) {
    await this.page!.goto(`https://ssl.jobcan.jp/m/work/accessrecord?recordDay=${date}`);
  }

  // 特定の日付編集ページを開く
  async openSpecificDateEditPage(date: string) {
    await this.page!.goto(`https://ssl.jobcan.jp/m/work/accessrecord?recordDay=${date}&_m=edit`);
  }

  // 打刻済かどうか
  async isStamped(_date: string) {
    // 編集画面を開く
    await this.openSpecificDatePage(_date);

    const hasMessage = await this.page!.evaluate(() => {
      return document.body.innerText.includes("出退勤がありません。");
    });

    if (!hasMessage) {
      return true;
    }

    return false;
  }

  // 未来日かどうか
  async isFutureDate(_date: string) {
    // 編集画面を開く
    await this.openSpecificDateEditPage(_date);

    const hasMessage = await this.page!.evaluate(() => {
      return document.body.innerText.includes("この日付は打刻修正できません。");
    });

    if (hasMessage) {
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
