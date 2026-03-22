/** 現在年月の取得（YYYYMM形式） */
function getCurrentYYYYMM(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
}

/** 1ヶ月前の年月を取得（YYYYMM形式） */
function getLastMonthYYYYMM(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
}

/** 日付文字列（YYYY-MM-DD）をYYYYMMDD形式に変換 */
function toYYYYMMDD(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  return `${yyyy}${mm}${dd}`;
}

/** 時刻文字列（H:MM）をHHMM形式に変換 */
function timeToHHMM(timeStr: string): string {
  const parts = timeStr.split(":");
  if (parts.length !== 2) return "";
  const [h, m] = parts;
  return h.padStart(2, "0") + m.padStart(2, "0");
}

export const Util = {
  getCurrentYYYYMM,
  getLastMonthYYYYMM,
  toYYYYMMDD,
  timeToHHMM,
};
