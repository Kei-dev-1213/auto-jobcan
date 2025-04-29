// 現在年月の取得
const getCurrentYYYYMM = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
};

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

export const Util = { getCurrentYYYYMM, toYYYYMMDD, timeToHHMM };
