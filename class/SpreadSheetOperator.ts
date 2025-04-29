import { JWT } from "google-auth-library";
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from "google-spreadsheet";
import { Util } from "../util";

export class SpreadSheetOperator {
  private doc: GoogleSpreadsheet | undefined;
  private sheet: GoogleSpreadsheetWorksheet | undefined;
  private workingHours: Array<WorkingHour> = [];

  private constructor() {}

  static async create(): Promise<SpreadSheetOperator> {
    const instance = new SpreadSheetOperator();
    await instance.initialize();
    return instance;
  }

  // 初期化処理
  private async initialize() {
    try {
      this.doc = new GoogleSpreadsheet(
        "1KSvDmZ4XFjwPlIFUBCcw43xSz24ROJSOeTqOiNqvM0g",
        new JWT({
          email: process.env.AUTH_GOOGLE_EMAIL!,
          key: process.env.AUTH_GOOGLE_KEY!,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        })
      );
      await this.doc.loadInfo();
      await this._loadSheet();
      await this._fetchWorkingHours(); // 縦
    } catch (e) {
      console.error("SpreadSheetOperatorの初期化中にエラーが発生しました:", e);
      throw new Error("SpreadSheetOperator初期処理でエラー");
    }
  }

  private async _loadSheet() {
    this.sheet = this.doc!.sheetsByTitle[Util.getCurrentYYYYMM()];
    if (!this.sheet) {
      throw new Error(`「${Util.getCurrentYYYYMM()}」シートが存在しません。`);
    }
    console.log(`${this.sheet.title}シートの転記を開始します。`);
  }

  // 勤務時間取得
  private async _fetchWorkingHours() {
    const rows = await this.sheet!.getRows();
    for (const row of rows) {
      const rowObject = row.toObject();
      const date = (rowObject["日付"] ?? "").trim();
      const startTime = (rowObject["開始時間"] ?? "").trim();
      const finishTime = (rowObject["終了時間"] ?? "").trim();
      if (date && startTime && finishTime) {
        this.workingHours.push(new WorkingHour(date, startTime, finishTime));
      }
    }
  }

  // 勤務時間取得（水平）
  // private async _fetchWorkingHoursByHorizontal() {
  // await this.sheet!.loadCells("A1:C32");
  // console.log(await this.sheet!.getCell(0, 1).value);
  // }

  // 日付を指定して取得
  getWorkingHour(date: string): WorkingHour | undefined {
    return this.workingHours.find((wHour) => wHour.date === date);
  }

  // 全体取得
  getWorkingHours(): Array<WorkingHour> {
    return this.workingHours;
  }
}

// 勤務時間クラス
class WorkingHour {
  date: string;
  startTime: string;
  finishTime: string;

  constructor(date: string, startTime: string, finishTime: string) {
    this.date = date;
    this.startTime = startTime;
    this.finishTime = finishTime;
  }
}
