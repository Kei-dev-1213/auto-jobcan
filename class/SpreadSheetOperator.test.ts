import { describe, expect, test, mock, beforeEach } from "bun:test";
import { SpreadSheetOperator } from "./SpreadSheetOperator";

// Google Sheets APIのモック
const mockGetRows = mock(() =>
  Promise.resolve([
    {
      toObject: () => ({
        "日付": "2025-02-01",
        "開始時間": "9:00",
        "終了時間": "18:00",
      }),
    },
    {
      toObject: () => ({
        "日付": "2025-02-02",
        "開始時間": "10:00",
        "終了時間": "19:00",
      }),
    },
  ]),
);

const mockLoadInfo = mock(() => Promise.resolve());

const mockSheet = {
  title: "202502",
  getRows: mockGetRows,
};

mock.module("google-spreadsheet", () => ({
  GoogleSpreadsheet: class {
    sheetsByTitle: Record<string, any> = { "202502": mockSheet };
    loadInfo = mockLoadInfo;
    constructor(_id: string, _auth: any) {}
  },
}));

mock.module("google-auth-library", () => ({
  JWT: class {
    constructor(_opts: any) {}
  },
}));

describe("SpreadSheetOperator", () => {
  beforeEach(() => {
    // 環境変数を設定
    process.env.AUTH_GOOGLE_SHEET_ID = "test-sheet-id";
    process.env.AUTH_GOOGLE_EMAIL = "test@example.iam.gserviceaccount.com";
    process.env.AUTH_GOOGLE_KEY = "test-private-key";

    mockGetRows.mockImplementation(() =>
      Promise.resolve([
        {
          toObject: () => ({
            "日付": "2025-02-01",
            "開始時間": "9:00",
            "終了時間": "18:00",
          }),
        },
        {
          toObject: () => ({
            "日付": "2025-02-02",
            "開始時間": "10:00",
            "終了時間": "19:00",
          }),
        },
      ]),
    );
    mockLoadInfo.mockClear();
  });

  describe("create", () => {
    test("SpreadSheetOperatorインスタンスを生成する", async () => {
      const operator = await SpreadSheetOperator.create("202502");
      expect(operator).toBeInstanceOf(SpreadSheetOperator);
    });

    test("初期化時にスプレッドシート情報を読み込む", async () => {
      await SpreadSheetOperator.create("202502");
      expect(mockLoadInfo).toHaveBeenCalled();
    });

    test("初期化時に行データを取得する", async () => {
      await SpreadSheetOperator.create("202502");
      expect(mockGetRows).toHaveBeenCalled();
    });

    test("存在しないシート名の場合エラーをスローする", async () => {
      await expect(
        SpreadSheetOperator.create("999999"),
      ).rejects.toThrow("SpreadSheetOperator初期処理でエラー");
    });
  });

  describe("getWorkingHours", () => {
    test("全ての勤務時間データを返す", async () => {
      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      expect(hours).toHaveLength(2);
      expect(hours[0]).toEqual({
        date: "20250201",
        startTime: "0900",
        finishTime: "1800",
      });
      expect(hours[1]).toEqual({
        date: "20250202",
        startTime: "1000",
        finishTime: "1900",
      });
    });

    test("空のシートの場合は空の配列を返す", async () => {
      mockGetRows.mockResolvedValueOnce([]);
      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      expect(hours).toHaveLength(0);
    });
  });

  describe("getWorkingHour", () => {
    test("指定日の勤務時間を返す", async () => {
      const operator = await SpreadSheetOperator.create("202502");
      const hour = operator.getWorkingHour("20250201");

      expect(hour).toEqual({
        date: "20250201",
        startTime: "0900",
        finishTime: "1800",
      });
    });

    test("存在しない日付の場合undefinedを返す", async () => {
      const operator = await SpreadSheetOperator.create("202502");
      const hour = operator.getWorkingHour("20250228");

      expect(hour).toBeUndefined();
    });
  });

  describe("不完全なデータの処理", () => {
    test("日付が空でも開始・終了時間があればデータとして含まれる（toYYYYMMDDは空文字をundefined含む文字列に変換する）", async () => {
      mockGetRows.mockImplementation(() =>
        Promise.resolve([
          {
            toObject: () => ({
              "日付": "",
              "開始時間": "9:00",
              "終了時間": "18:00",
            }),
          },
          {
            toObject: () => ({
              "日付": "2025-02-01",
              "開始時間": "9:00",
              "終了時間": "18:00",
            }),
          },
        ]),
      );

      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      // toYYYYMMDD("")は"undefinedundefined"を返す（truthy）ため、行はスキップされない
      expect(hours).toHaveLength(2);
    });

    test("開始時間が空の行はスキップされる", async () => {
      mockGetRows.mockImplementation(() =>
        Promise.resolve([
          {
            toObject: () => ({
              "日付": "2025-02-01",
              "開始時間": "",
              "終了時間": "18:00",
            }),
          },
        ]),
      );

      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      expect(hours).toHaveLength(0);
    });

    test("終了時間が空の行はスキップされる", async () => {
      mockGetRows.mockImplementation(() =>
        Promise.resolve([
          {
            toObject: () => ({
              "日付": "2025-02-01",
              "開始時間": "9:00",
              "終了時間": "",
            }),
          },
        ]),
      );

      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      expect(hours).toHaveLength(0);
    });

    test("日付列が存在しない場合でもnullish coalescingで空文字列扱いになりデータが含まれる", async () => {
      mockGetRows.mockImplementation(() =>
        Promise.resolve([
          {
            toObject: () => ({
              // "日付"列がない → undefined ?? "" → "" → toYYYYMMDD("") → "undefinedundefined"（truthy）
              "開始時間": "9:00",
              "終了時間": "18:00",
            }),
          },
        ]),
      );

      const operator = await SpreadSheetOperator.create("202502");
      const hours = operator.getWorkingHours();

      // "日付"がundefined → ?? "" → toYYYYMMDD("") → "undefinedundefined"（truthy）
      // "開始時間"は"0900"、"終了時間"は"1800"（共にtruthy）→ pushされる
      expect(hours).toHaveLength(1);
    });
  });
});
