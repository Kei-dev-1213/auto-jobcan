import { SpreadSheetOperator } from "./class/SpreadSheetOperator";
import { BrowserOperator } from "./class/BrowserOperator";
import { Util } from "./util";

// 即時実行
(async () => {
  // 引数の年月
  const [, , yyyymm] = Bun.argv;

  try {
    // スプレッドシート
    const sheet = await SpreadSheetOperator.create(yyyymm ?? Util.getCurrentYYYYMM());
    const workingHours = sheet.getWorkingHours();

    // ブラウザ操作
    const browser = await BrowserOperator.create();
    await browser.login(); // ログイン

    // スプレッドシートの日付分繰り返し
    let count = 0;
    for (const _wHour of workingHours) {
      const { date, startTime, finishTime } = _wHour;

      // 未打刻の場合のみ
      if (!(await browser.isStamped(date))) {
        // 未来日ではない場合のみ
        if (!(await browser.isFutureDate(date))) {
          // 打刻
          await browser.stamp(date, startTime, finishTime);
          console.log(`${date}を開始時刻${startTime}、終了時刻を${finishTime}で打刻しました。`);
          ++count;
        } else {
          console.log(`${date}は未来日のため打刻しません。`);
          break;
        }
      } else {
        console.log(`${date}は打刻済です。`);
      }
    }

    await browser.finalize(); // 終了
    console.log(`シートの転記処理が完了しました。打刻日数：${count}件`);
  } catch (e) {
    console.error("ジョブカンの転記処理が異常終了しました。", e);
  }
})();
