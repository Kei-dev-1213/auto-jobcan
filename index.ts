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

    // スプレッドシートの日付分を並列処理
    const results = await Promise.all(
      workingHours.map(async ({ date, startTime, finishTime }) => {
        try {
          // 未打刻の場合のみ
          if (await browser.isStamped(date)) {
            console.log(`${date}は打刻済です。`);
            return false;
          }

          // 未来日ではない場合のみ
          if (await browser.isFutureDate(date)) {
            console.log(`${date}は未来日のため打刻しません。`);
            return false;
          }

          // 打刻
          await browser.stamp(date, startTime, finishTime);
          console.log(`${date}を開始時刻${startTime}、終了時刻を${finishTime}で打刻しました。`);
          return true;
        } catch (error) {
          console.error(`日付 ${date} の処理中にエラーが発生しました:`, error);
          return false;
        }
      })
    );

    // 打刻成功件数をカウント
    const count = results.filter((result) => result).length;

    await browser.finalize(); // 終了
    console.log(`シートの転記処理が完了しました。打刻日数：${count}件`);
  } catch (e) {
    console.error("ジョブカンの転記処理が異常終了しました。", e);
  }
})();
