import { SpreadSheetOperator } from "./class/SpreadSheetOperator";
import { BrowserOperator } from "./class/BrowserOperator";
import { Util } from "./util";

// 即時実行
(async () => {
  try {
    // スプレッドシート
    const sheet = await SpreadSheetOperator.create();
    const workingHours = sheet.getWorkingHours();

    // ブラウザ操作
    const browser = await BrowserOperator.create();
    await browser.login(); // ログイン

    // スプレッドシートの日付分繰り返し
    for (const _wHour of workingHours) {
      const _date = Util.toYYYYMMDD(_wHour.date);
      const _sTime = Util.timeToHHMM(_wHour.startTime);
      const _fTime = Util.timeToHHMM(_wHour.finishTime);

      // 未打刻の場合のみ
      if (!(await browser.isStamped(_date))) {
        // 未来日ではない場合のみ
        if (!(await browser.isFutureDate(_date))) {
          // 日付編集画面を開く
          await browser.openSpecificDateEditPage(_date);

          // 打刻
          await browser.regist(_sTime, _fTime);
          console.log(`${_date}を開始時刻${_sTime}、終了時刻を${_fTime}で打刻しました。`);
        } else {
          console.log(`${_date}は未来日のため打刻しません。`);
          break;
        }
      }
    }

    await browser.finalize(); // 終了
  } catch (e) {
    console.error("ジョブカンの転記処理が異常終了しました。", e);
  }
})();
