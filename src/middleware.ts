import {readSessionToken} from "@/lib/auth/accessToken";
import {classifyPath, SESSION_EXPIRED_REASON} from "@/lib/routeAccess";
import {NextResponse, type NextRequest} from "next/server";

const STATIC_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|css|js)$/i;

// next-auth 의 auth() 래퍼를 쓰지 않는다: 그 래퍼는 요청마다 세션 쿠키를 다시 써서,
// refresh 로 회전된 쿠키를 늦게 끝난 요청이 옛 refreshToken 으로 덮는다 → 쿠키는 읽기만 한다 (ADR 0007)
export default async function middleware(req: NextRequest) {
    const {pathname, search} = req.nextUrl;

    if (STATIC_EXT.test(pathname)) {
        return NextResponse.next();
    }

    const isLoggedIn = !!(await readSessionToken(req));
    const access = classifyPath(pathname);

    if (isLoggedIn && access === "publicOnly") {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (!isLoggedIn && access === "protected") {
        // 원래 경로로 돌아오도록 callbackUrl 을 남긴다 (#해시는 서버로 오지 않아 보존할 수 없다)
        const login = new URL("/login", req.url);
        login.searchParams.set("callbackUrl", pathname + search);
        // 세션 쿠키가 남아 있었다면 만료로 끝난 것
        if (req.cookies.getAll().some((c) => c.name.includes("authjs.session-token"))) {
            login.searchParams.set("reason", SESSION_EXPIRED_REASON);
        }
        return NextResponse.redirect(login);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
