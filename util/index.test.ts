import { describe, expect, test } from "bun:test";
import { Util } from "./index";

describe("Util", () => {
  describe("getCurrentYYYYMM", () => {
    test("現在の年月をYYYYMM形式で返す", () => {
      const result = Util.getCurrentYYYYMM();
      // YYYYMM形式であることを確認
      expect(result).toMatch(/^\d{6}$/);
      // 実際の現在年月と一致
      const now = new Date();
      const expected = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      expect(result).toBe(expected);
    });

    test("返り値は6文字の文字列", () => {
      const result = Util.getCurrentYYYYMM();
      expect(result.length).toBe(6);
    });
  });

  describe("getLastMonthYYYYMM", () => {
    test("前月の年月をYYYYMM形式で返す", () => {
      const result = Util.getLastMonthYYYYMM();
      expect(result).toMatch(/^\d{6}$/);
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      const expected = `${date.getFullYear()}${("0" + (date.getMonth() + 1)).slice(-2)}`;
      expect(result).toBe(expected);
    });

    test("返り値は6文字の文字列", () => {
      const result = Util.getLastMonthYYYYMM();
      expect(result.length).toBe(6);
    });
  });

  describe("toYYYYMMDD", () => {
    test("YYYY-MM-DD形式をYYYYMMDD形式に変換する", () => {
      expect(Util.toYYYYMMDD("2025-02-01")).toBe("20250201");
    });

    test("月と日が1桁の場合もそのまま変換する", () => {
      expect(Util.toYYYYMMDD("2025-1-5")).toBe("202515");
    });

    test("異なる年月日を正しく変換する", () => {
      expect(Util.toYYYYMMDD("2024-12-31")).toBe("20241231");
      expect(Util.toYYYYMMDD("2025-01-01")).toBe("20250101");
    });

    test("空文字列の場合はundefinedを含む文字列を返す", () => {
      // ""をsplitすると[""]が返り、yyyy=""、mm=undefined、dd=undefined
      const result = Util.toYYYYMMDD("");
      expect(result).toBe("undefinedundefined");
    });

    test("ハイフンなしの場合はundefinedを含む文字列を返す", () => {
      // splitは1要素の配列を返すので、mm/ddがundefined
      const result = Util.toYYYYMMDD("20250201");
      expect(result).toBe("20250201undefinedundefined");
    });
  });

  describe("timeToHHMM", () => {
    test("HH:MM形式をHHMM形式に変換する", () => {
      expect(Util.timeToHHMM("09:00")).toBe("0900");
      expect(Util.timeToHHMM("18:00")).toBe("1800");
    });

    test("1桁の時間をゼロ埋めする", () => {
      expect(Util.timeToHHMM("9:00")).toBe("0900");
      expect(Util.timeToHHMM("9:5")).toBe("0905");
    });

    test("深夜の時間を正しく変換する", () => {
      expect(Util.timeToHHMM("00:00")).toBe("0000");
      expect(Util.timeToHHMM("23:59")).toBe("2359");
    });

    test("空文字列の場合は空文字列を返す", () => {
      expect(Util.timeToHHMM("")).toBe("");
    });

    test("コロンがない場合は不完全な結果を返す", () => {
      // splitは1要素を返し、mがundefinedになるのでpadStartでエラー→catchで空文字列
      const result = Util.timeToHHMM("0900");
      expect(result).toBe("");
    });
  });
});
