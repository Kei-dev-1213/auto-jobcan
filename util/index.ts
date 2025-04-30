// 先月の年月を取得
function getLastMonthYYYYMM(): string {
  const today = new Date();
  // 月を1減らす（1月の場合は前年の12月になる）
  today.setMonth(today.getMonth() - 1);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

// 日付形式のハイフンを削除
function toYYYYMMDD(dateStr: string): string {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${yyyy}${mm}${dd}`;
}

// 打刻時間を登録できる形式に変換
function timeToHHMM(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  return h.padStart(2, "0") + m.padStart(2, "0");
}

export const Util = { getLastMonthYYYYMM, toYYYYMMDD, timeToHHMM };
