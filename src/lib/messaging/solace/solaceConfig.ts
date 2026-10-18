const SOLACE_USER_NAME = process.env.SOLACE_USER_NAME;
const SOLACE_USER_PWD = process.env.SOLACE_USER_PWD;

export const SOLACE_CONFIG = {
    host: "ws://localhost:8008", // WebSocket Plain Text Port
    vpnName: "TSH",
    //   username: SOLACE_USER_NAME,
    //   password: SOLACE_USER_PWD,
    username: "admin",
    password: "admin",
    clientName: "tsh-web-client",
    responseTopic: "TET/REP/user-1", // ✅ 유저별 Topic (추후 동적으로)
} as const;

// 발송 Topic
export const TOPICS = {
    REQUEST: "TET/REQ/H01/user-1",
} as const;
