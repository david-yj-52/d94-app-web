import axios from "axios";

/** 서버 오류 메시지(409 제목 중복 등)를 그대로, 없으면 fallback */
export const docsError = (e: unknown, fallback: string): string =>
    (axios.isAxiosError(e) && (e.response?.data as { message?: string } | undefined)?.message) || fallback;
