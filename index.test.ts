import { describe, expect, test, mock, beforeEach, spyOn } from "bun:test";

// index.tsのメインロジックのフローテスト
// index.tsは即時実行関数(IIFE)のため、直接importするとpuppeteerの起動等が発生する。
// ここではメインロジックの条件分岐を再現してフローのテストを行う。

interface WorkingHourLike {
  date: string;
  startTime: string;
  finishTime: string;
}

interface BrowserLike {
  login(): Promise<void>;
  isStamped(date: string): Promise<boolean>;
  isFutureDate(date: string): Promise<boolean>;
  stamp(date: string, sTime: string, fTime: string): Promise<void>;
  finalize(): void;
}

// index.tsのメインロジックを関数として再現
async function mainLogic(
  workingHours: WorkingHourLike[],
  browser: BrowserLike,
): Promise<{ count: number; logs: string[] }> {
  const logs: string[] = [];
  await browser.login();

  let count = 0;
  for (const _wHour of workingHours) {
    const { date, startTime, finishTime } = _wHour;

    if (!(await browser.isStamped(date))) {
      if (!(await browser.isFutureDate(date))) {
        await browser.stamp(date, startTime, finishTime);
        logs.push(`${date}を開始時刻${startTime}、終了時刻を${finishTime}で打刻しました。`);
        ++count;
      } else {
        logs.push(`${date}は未来日のため打刻しません。`);
        break;
      }
    } else {
      logs.push(`${date}は打刻済です。`);
    }
  }

  browser.finalize();
  logs.push(`シートの転記処理が完了しました。打刻日数：${count}件`);
  return { count, logs };
}

describe("メイン処理フロー", () => {
  const mockIsStamped = mock(() => Promise.resolve(false));
  const mockIsFutureDate = mock(() => Promise.resolve(false));
  const mockStamp = mock(() => Promise.resolve());
  const mockLogin = mock(() => Promise.resolve());
  const mockFinalize = mock(() => {});

  let browser: BrowserLike;
  let workingHours: WorkingHourLike[];

  beforeEach(() => {
    mockIsStamped.mockClear();
    mockIsFutureDate.mockClear();
    mockStamp.mockClear();
    mockLogin.mockClear();
    mockFinalize.mockClear();

    mockIsStamped.mockImplementation(() => Promise.resolve(false));
    mockIsFutureDate.mockImplementation(() => Promise.resolve(false));

    browser = {
      login: mockLogin,
      isStamped: mockIsStamped,
      isFutureDate: mockIsFutureDate,
      stamp: mockStamp,
      finalize: mockFinalize,
    };

    workingHours = [
      { date: "20250201", startTime: "0900", finishTime: "1800" },
      { date: "20250202", startTime: "1000", finishTime: "1900" },
    ];
  });

  test("未打刻・未来日でない場合に全件打刻される", async () => {
    const result = await mainLogic(workingHours, browser);

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockStamp).toHaveBeenCalledTimes(2);
    expect(mockStamp).toHaveBeenCalledWith("20250201", "0900", "1800");
    expect(mockStamp).toHaveBeenCalledWith("20250202", "1000", "1900");
    expect(mockFinalize).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(2);
    expect(result.logs).toContain("20250201を開始時刻0900、終了時刻を1800で打刻しました。");
    expect(result.logs).toContain("20250202を開始時刻1000、終了時刻を1900で打刻しました。");
  });

  test("打刻済みの場合はスキップされる", async () => {
    mockIsStamped.mockImplementation(() => Promise.resolve(true));

    const result = await mainLogic(workingHours, browser);

    expect(mockStamp).not.toHaveBeenCalled();
    expect(result.count).toBe(0);
    expect(result.logs).toContain("20250201は打刻済です。");
    expect(result.logs).toContain("20250202は打刻済です。");
  });

  test("未来日の場合はbreakして以降の処理をスキップする", async () => {
    mockIsFutureDate.mockImplementation(() => Promise.resolve(true));

    const result = await mainLogic(workingHours, browser);

    expect(mockStamp).not.toHaveBeenCalled();
    expect(result.count).toBe(0);
    // 最初の日付で未来日と判定されbreakするので、isFutureDateは1回だけ
    expect(mockIsFutureDate).toHaveBeenCalledTimes(1);
    expect(result.logs).toContain("20250201は未来日のため打刻しません。");
    // 2件目は処理されない
    expect(result.logs).not.toContain("20250202は未来日のため打刻しません。");
  });

  test("1件目が打刻済み、2件目が未打刻の混合パターン", async () => {
    let callCount = 0;
    mockIsStamped.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1);
    });

    const result = await mainLogic(workingHours, browser);

    expect(mockStamp).toHaveBeenCalledTimes(1);
    expect(mockStamp).toHaveBeenCalledWith("20250202", "1000", "1900");
    expect(result.count).toBe(1);
    expect(result.logs).toContain("20250201は打刻済です。");
  });

  test("勤務データが空の場合はスタンプされない", async () => {
    const result = await mainLogic([], browser);

    expect(mockStamp).not.toHaveBeenCalled();
    expect(mockIsStamped).not.toHaveBeenCalled();
    expect(result.count).toBe(0);
  });

  test("1件目が未打刻、2件目が未来日の場合", async () => {
    let futureDateCallCount = 0;
    mockIsFutureDate.mockImplementation(() => {
      futureDateCallCount++;
      return Promise.resolve(futureDateCallCount === 2);
    });

    const result = await mainLogic(workingHours, browser);

    // 1件目は打刻される
    expect(mockStamp).toHaveBeenCalledTimes(1);
    expect(mockStamp).toHaveBeenCalledWith("20250201", "0900", "1800");
    expect(result.count).toBe(1);
    // 2件目は未来日でbreak
    expect(result.logs).toContain("20250202は未来日のため打刻しません。");
  });

  test("finalize()は必ず呼ばれる", async () => {
    await mainLogic(workingHours, browser);
    expect(mockFinalize).toHaveBeenCalledTimes(1);
  });
});
