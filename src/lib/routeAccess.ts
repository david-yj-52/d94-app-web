// 미들웨어 경로 판정 → docs/architecture.md

export type PathAccess = "protected" | "publicOnly" | "open";

const PROTECTED_PREFIXES = ["/cira", "/interface-test"];
const PUBLIC_ONLY = ["/login", "/register"];
// 예전 가입 경로(/register 로 redirect). 비로그인 사용자도 들어와야 한다
const PROTECTED_EXCEPTIONS = ["/cira/register"];

export function classifyPath(pathname: string): PathAccess {
    if (PUBLIC_ONLY.includes(pathname)) return "publicOnly";
    if (PROTECTED_EXCEPTIONS.includes(pathname)) return "open";
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    return isProtected ? "protected" : "open";
}
