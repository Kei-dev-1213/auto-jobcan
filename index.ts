import { SpreadSheetOperator } from "./class/SpreadSheetOperator";
import { BrowserOperator } from "./class/BrowserOperator";
import { Util } from "./util";

(async () => {
  const [, , yyyymm] = Bun.argv;
  let browser: BrowserOperator | undefined;

  try {
    // スプレッドシート
    const sheet = await SpreadSheetOperator.create(
      yyyymm ?? Util.getCurrentYYYYMM(),
    );
    const workingHours = sheet.getWorkingHours();

    // ブラウザ操作
    browser = await BrowserOperator.create();
    await browser.login();

    // スプレッドシートの日付分繰り返し
    let count = 0;
    for (const { date, startTime, finishTime } of workingHours) {
      // 未打刻の場合のみ
      if (!(await browser.isStamped(date))) {
        // 未来日ではない場合のみ
        if (!(await browser.isFutureDate(date))) {
          await browser.stamp(date, startTime, finishTime);
          console.log(
            `${date}を開始時刻${startTime}、終了時刻を${finishTime}で打刻しました。`,
          );
          ++count;
        } else {
          console.log(`${date}は未来日のため打刻しません。`);
          break;
        }
      } else {
        console.log(`${date}は打刻済です。`);
      }
    }

    console.log(`シートの転記処理が完了しました。打刻日数：${count}件`);
  } catch (e) {
    console.error("ジョブカンの転記処理が異常終了しました。", e);
    process.exit(1);
  } finally {
    await browser?.finalize();
  }
})();
