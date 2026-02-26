export const CONSTANTS = {
  SELECTORS: {
    INPUT: {
      COMPANY_ID: "#client_id",
      EMAIL: "#email",
      PASSWORD: "#password",
      START_TIME: "#time1",
      FINISH_TIME: "#time2",
    },
    BUTTON: {
      LOGIN:
        "body > div.login-content > div > div > form > div:nth-child(6) > button",
      STAMP:
        "#container > div:nth-child(7) > form > input[type=submit]:nth-child(11)",
    },
  },
  URL: {
    JOBCAN: {
      TOP: "https://ssl.jobcan.jp/login/mb-employee-global?redirect_to=%2Fm%2Findex",
      SPECIFIC_DATE_PREFIX:
        "https://ssl.jobcan.jp/m/work/accessrecord?recordDay=",
      SPECIFIC_DATE_SUFFIX: "&_m=edit",
    },
  },
  MESSAGES: {
    NO_WORK_MESSAGE: "出退勤がありません。",
    CANNOT_MODIFY_MESSAGE: "この日付は打刻修正できません。",
  },
};
