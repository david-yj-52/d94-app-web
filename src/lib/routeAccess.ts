// 미들웨어 경로 판정 → docs/architecture.md

/** 세션 만료로 로그인 화면에 왔을 때의 ?reason= 값 (LoginForm 의 LOGIN_NOTICES 키) */
export const SESSION_EXPIRED_REASON = "expired";

export type PathAccess = "protected" | "publicOnly" | "open";

const PROTECTED_PREFIXES = ["/cira", "/interface-test", "/study", "/ayaan"];
const PUBLIC_ONLY = ["/login", "/register"];
// 예전 가입 경로(/register 로 redirect). 비로그인 사용자도 들어와야 한다
const PROTECTED_EXCEPTIONS = ["/cira/register"];

export function classifyPath(pathname: string): PathAccess {
    if (PUBLIC_ONLY.includes(pathname)) return "publicOnly";
    if (PROTECTED_EXCEPTIONS.includes(pathname)) return "open";
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    return isProtected ? "protected" : "open";
}

/** 로그인 뒤 돌아갈 경로. 같은 사이트의 내부 경로만 허용하고, 아니면 /home (open redirect 차단) */
export function safeCallbackUrl(raw: unknown): string {
    if (typeof raw !== "string" || !raw.startsWith("/")) return "/home";
    // "//evil.com", "/\evil.com", "/\t/evil.com" 은 브라우저가 외부 주소로 푼다 → URL 로 풀어 origin 이 그대로인지 확인
    const base = "http://internal";
    const url = new URL(raw, base);
    if (url.origin !== base) return "/home";
    return classifyPath(url.pathname) === "publicOnly" ? "/home" : url.pathname + url.search + url.hash;
}
