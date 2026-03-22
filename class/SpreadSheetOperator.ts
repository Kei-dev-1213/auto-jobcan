import { JWT } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { Util } from "../util";
import type { WorkingHour } from "../types";

export class SpreadSheetOperator {
  private sheet: GoogleSpreadsheetWorksheet;
  private workingHours: WorkingHour[] = [];

  private constructor(sheet: GoogleSpreadsheetWorksheet) {
    this.sheet = sheet;
  }

  static async create(yyyymm: string): Promise<SpreadSheetOperator> {
    const { AUTH_GOOGLE_SHEET_ID, AUTH_GOOGLE_EMAIL, AUTH_GOOGLE_KEY } =
      SpreadSheetOperator.getGoogleCredentials();

    try {
      const doc = new GoogleSpreadsheet(
        AUTH_GOOGLE_SHEET_ID,
        new JWT({
          email: AUTH_GOOGLE_EMAIL,
          key: AUTH_GOOGLE_KEY,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        }),
      );
      await doc.loadInfo();

      const sheet = doc.sheetsByTitle[yyyymm];
      if (!sheet) {
        throw new Error(`「${yyyymm}」シートが存在しません。`);
      }

      console.log(`${sheet.title}シートの転記を開始します。`);

      const instance = new SpreadSheetOperator(sheet);
      await instance.fetchWorkingHours();
      return instance;
    } catch (e) {
      console.error("SpreadSheetOperatorの初期化中にエラーが発生しました:", e);
      throw new Error("SpreadSheetOperator初期処理でエラー");
    }
  }

  // 勤務時間取得
  private async fetchWorkingHours(): Promise<void> {
    const rows = await this.sheet.getRows();
    for (const row of rows) {
      const rowObject = row.toObject();
      const date = Util.toYYYYMMDD((rowObject["日付"] ?? "").trim());
      const startTime = Util.timeToHHMM((rowObject["開始時間"] ?? "").trim());
      const finishTime = Util.timeToHHMM((rowObject["終了時間"] ?? "").trim());
      if (date && startTime && finishTime) {
        this.workingHours.push({ date, startTime, finishTime });
      }
    }
  }

  // 日付を指定して取得
  getWorkingHour(date: string): WorkingHour | undefined {
    return this.workingHours.find((wHour) => wHour.date === date);
  }

  // 全体取得
  getWorkingHours(): ReadonlyArray<WorkingHour> {
    return this.workingHours;
  }

  // 環境変数のバリデーション
  private static getGoogleCredentials() {
    const AUTH_GOOGLE_SHEET_ID = process.env.AUTH_GOOGLE_SHEET_ID;
    const AUTH_GOOGLE_EMAIL = process.env.AUTH_GOOGLE_EMAIL;
    const AUTH_GOOGLE_KEY = process.env.AUTH_GOOGLE_KEY;

    if (!AUTH_GOOGLE_SHEET_ID || !AUTH_GOOGLE_EMAIL || !AUTH_GOOGLE_KEY) {
      throw new Error(
        "Google認証情報の環境変数が不足しています: AUTH_GOOGLE_SHEET_ID, AUTH_GOOGLE_EMAIL, AUTH_GOOGLE_KEY",
      );
    }

    return { AUTH_GOOGLE_SHEET_ID, AUTH_GOOGLE_EMAIL, AUTH_GOOGLE_KEY };
  }
}
