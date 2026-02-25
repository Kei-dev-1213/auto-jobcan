import { JWT } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { Util } from "../util";

export class SpreadSheetOperator {
  private doc: GoogleSpreadsheet | undefined;
  private sheet: GoogleSpreadsheetWorksheet | undefined;
  private workingHours: Array<WorkingHour> = [];

  private constructor() {}

  static async create(yyyymm: string): Promise<SpreadSheetOperator> {
    const instance = new SpreadSheetOperator();
    await instance.initialize(yyyymm);
    return instance;
  }

  // 初期化処理
  private async initialize(yyyymm: string) {
    try {
      this.doc = new GoogleSpreadsheet(
        "1KSvDmZ4XFjwPlIFUBCcw43xSz24ROJSOeTqOiNqvM0g",
        new JWT({
          email: process.env.AUTH_GOOGLE_EMAIL!,
          key: "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQC39ar2m1CBriKZ\nHV7I5ocpQcyeFHmdHY5SD4VOsYbc1bO+e1lU54MuZSj+LVHjXV8eQjpCAc0dGGo9\nZEAQLg6jFr63dZBmQ2nl0Qk2k1zPEY3ltP7WKDn3MxEzy7Nrn8tMjSQOuVTWa4hE\nNY7gcGiGQig+sJ1BQ0IbYp40VfdNqqNBVMlRuBHk5upXsSKgtUC4Siw2yX8vUvaA\nozISrJ+VACn/i7zQzLZNdtqKUlgf/kjouKAA1Hua6hPfoT6VFygJcRHOkoNPVlrX\ngT1GvrXfck+ehT4GA+KOMplN8Qy4UoqLZZ8husbchgera5lVedS/dGcIPc0QCfyn\np5ktOVJJAgMBAAECgf8mY4o//+5M+jsWuMVniceq8fK3gI5Wk9483ztexF598kIQ\nOSOcdrOkeu31f2vv6QxJEv8pAjc35P335XPHxTc1DJPnefnF05pjUUXf2M0FVYbu\ncpH2qNDSWQcMvjCpJ2qeDv2BKMlaRGU1OTMXttOjCXoNwmsOn8lJY97HSDz62lAb\nu5Ms2QNDKJDLbmxEoSqOomsGrBqFCfuHocacHrRjHID0zug9/Dde6OT0Xn4Gv7qx\nENdIa8UhXXbLFeuCWbrPaaMUFq4WXHjV8c9iDjhpZx7wsdbnAENHqbA0LoPsAE7Q\nMxQjgxGOxr1TJeXx803CY2Xs8zb8XOhkuDpfIokCgYEA64UMUjVLl9D2LOaDINBC\nIP5TTOLT7Z1AqPDwdlMdxvFjr+TTaomku5CvhEGjAzhCwZogkEOQ0PO72xlyjP4L\nk0wNp2/HFlvfqDzsVvVM4BTvx4K+M5ZyHa9x+k6JiO0z3zXlmHeBXrQHDWj7ttFc\nrAuIx//aYcv+l1dEWziYlR0CgYEAx/TUlKwvH8s9rrzxnkFclbVj6lq21iJAjY3c\nBxOMO8LnRlvxjqxNaIlOc968rAeRNBnxekFyOfshDXDLnxLkeCO7lPzE147R1CAM\nvJHbrw836orgPZOJPJzCP23fjZ5BI6ccpn7YwlFq8DDp7po3+xiNbIDqBsIbBMy8\naqxMxh0CgYEAoXFmbMPTuZGn7kdlA40+h1dOypmCJJNyy1u9uZ5n/wNhDiWRNqp7\nnYckiUhk8cQTHpsET1/BWTp6P0pGV5edX672fRwGILGBstVwPHuR4tj3NI/OyZYL\nS4YEX0yOwqm2sP9FDyp8J+rIGs0oHr2NBPIzJMWhcQBg2GUdmlpFXZECgYAVsWQW\ntQ9vvZb1jB4SczjeLQ2n8SuA07p5IPjL87z1BtIcegEc32iOfMb8HyAM8c04/8+I\n2ezQiYQudxxAJ8aNmiLRqRKZ6C6vesKm+pQAy//e/C4TwBvVbZRNWVg1fwPGIG0l\nSwGtIzQc1tGqRyTnouRE7z90eD6CKMwQLp0tqQKBgCNaDAxvIST5diOfoUrmdTJF\nD7kzd7unUzmK54lEU/VliUAKi/qw8Og3044YgyVvAf7F7rzbwhw4xZOll+OOW/uk\ntZ3vzHsC1RhEj39hckh0hdBvUk+tp7BfdLpwSgmvYTCv3PzbzHFcm1h1EcJF+YD3\nc/eI2HG1XlWaYaPMeBeh\n-----END PRIVATE KEY-----\n",
          // key: process.env.AUTH_GOOGLE_KEY!,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        }),
      );
      await this.doc.loadInfo();
      await this._loadSheet(yyyymm);
      await this._fetchWorkingHours(); // 縦
    } catch (e) {
      console.error("SpreadSheetOperatorの初期化中にエラーが発生しました:", e);
      throw new Error("SpreadSheetOperator初期処理でエラー");
    }
  }

  private async _loadSheet(yyyymm: string) {
    const targetYM = yyyymm;
    this.sheet = this.doc!.sheetsByTitle[targetYM];
    if (!this.sheet) {
      throw new Error(`「${targetYM}」シートが存在しません。`);
    }
    console.log(`${this.sheet.title}シートの転記を開始します。`);
  }

  // 勤務時間取得
  private async _fetchWorkingHours() {
    const rows = await this.sheet!.getRows();
    for (const row of rows) {
      const rowObject = row.toObject();
      const date = Util.toYYYYMMDD((rowObject["日付"] ?? "").trim());
      const startTime = Util.timeToHHMM((rowObject["開始時間"] ?? "").trim());
      const finishTime = Util.timeToHHMM((rowObject["終了時間"] ?? "").trim());
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
