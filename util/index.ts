// 現在年月の取得
const getCurrentYYYYMM = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
};

// 1ヶ月前の月の取得
function getLastMonthYYYYMM(): string {
  const date = new Date();
  // 1ヶ月前に設定
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  return `${year}${month}`;
}

// 日付形式のハイフンを削除
function toYYYYMMDD(dateStr: string): string {
  let yyyymmdd = "";
  try {
    const [yyyy, mm, dd] = dateStr.split("-");
    yyyymmdd = `${yyyy}${mm}${dd}`;
  } catch {}
  return yyyymmdd;
}

// 打刻時間を登録できる形式に変換
function timeToHHMM(timeStr: string): string {
  let hhmm = "";
  try {
    const [h, m] = timeStr.split(":");
    hhmm = h.padStart(2, "0") + m.padStart(2, "0");
  } catch {}
  return hhmm;
}

export const Util = { getCurrentYYYYMM, getLastMonthYYYYMM, toYYYYMMDD, timeToHHMM };
