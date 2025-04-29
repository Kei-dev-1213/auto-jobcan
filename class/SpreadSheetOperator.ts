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
          key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCX00AUwfq1LRQO\nfMRNeIzSBCyRf0YVMTA/UsvohBZ9hCIwoRPtQp6aIJ5Rt290FpFykdgdJEjD+oPO\nzLSVid5vH3SuexMFCAYINq1WYfzDMS0z0Zh7UZaoqdQw4ZIK6D5RD2PCs3ZQCWjM\not5WJBLxog3VcsJ6J/+B8dDRTeBynqAct5UBl1wpH4nV3wD4zHIs1zPaGjbMEFJu\nSWbBHFJBhHXHu1gB3EXkPXQveVUU4BeMyfV4ne8bH8O1HD0+kd0N8DlAq1nQebtU\nd/Rn/2K93WzYAoAdy/Kyxh+ieYZrbsOuquTuzeTD2zIzGoSCYJB4ELyjn8ufMqY9\nxw0OyJVdAgMBAAECggEACSeRae8Bs/eiNEwXoL2PwtYXmIpTv9FgdwusrzolClpz\nnqUHyOWcdJoE5ykoDO2TcD9qXY943RWiPvpJj+lpQnVjbrs4ZrRDe4P4fbNDhMLW\nq+o2cdvLOXj2tMp/04KKHLnQf8accAUGjwLpucihD8rVX1/KaYfh4y72iA2pu/TM\nKU7oJGqUuDCJbscwfbwQBbR/m12WaVn4yI9Lwu5zot9TlsKK046DjATEmh0RckUR\nex4Q8er6l6QPIrFG++vfAYHQV3wNKocoAac0u8a2pmY3wi6hdJRDYPxoCrBnOiYj\nK9Jaq0V2L4UJDG5v852L5SIyewh3P348nJgjB6xOQQKBgQDMGqDRnzluEOfZsyeG\nlKu2l99j89uc036UJyQ4bRcfijemjLzItUGAi2ugHLzeuDyEkFOynM9AoS/Q1Qyg\neX1rVi8jjLuCsSTABkSVHfzZYVyq8xNQXbqa1yXeJaidbUBmunY0J4AzeXoLUkAB\ne2Tir3U06Jd7TRRCWJINPrybLQKBgQC+bbteY3btax92Tq9+C6RShO7UjQwxevPF\nwh6S69Btmqsf/MXWOuAPZwIdvShrQxpQyaiM13NC9iYDf1BD1PB+lcbLowZSLBLC\nuCDcy85ANtnjZ31X7HDK5WEBIWZ6OMOqrKFHJF3FssYA4qhYWoVJoOlLZyRpSVHt\nzqhFrrSA8QKBgQCWLFF/asP6s/2jNCo031aodn4rMNW5QfO0VkhULBADaNMhfBO7\nKYIUboC1we9FgBEnCHpMxQvI5dAku10bBci+HR957KZatrPvha0YeoP7/aMNNORV\nEWGnY/28wcCadDQaYb9vCFFPjmW5xr7JWF0WXTrDvw8V7dSmLDzp+esT0QKBgQCH\nm4EIsHAqllRrXZFfg07bbMrfFiqOue4K8DfxjHh69N/UAZ+o9XhFv6ckImY8LCb7\nTP/4fB0anEtpxioUg/lXS7WrokaIEdayT4kncwNHe0gixrnd+QRBmKNBuNVPSEke\nq5yWGvGkLbEPRFl5wcyVKD+6cJLfX1U2sinmpYjpIQKBgQC24hjlQf7MV9HLyio+\nu2Eh8nYBHx2WPEpjeYILUG9tDX/eZPrUPyhKMGaajjH7AenTNfO8+Ii93qBQnh2Q\nmDMfu4do1fVun5kF20z3PCfWoqjC4nQBte69OuEHoaKycfvT7a1jfE+RbMygeVXL\nOqg7PiNJ99eCW71LSaDKNFp3mg==\n-----END PRIVATE KEY-----\n",
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
