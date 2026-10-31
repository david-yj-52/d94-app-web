// mock 사용 여부만 따로 둔다 — src/auth.ts(미들웨어에서도 import)가 mock 라우터 전체를 끌어오지 않도록
export const isMockEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_MOCK_API === "true";
