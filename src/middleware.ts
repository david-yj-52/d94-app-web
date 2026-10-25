import {auth} from "@/auth";
import {NextResponse} from "next/server";

const STATIC_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|css|js)$/i;
const PROTECTED_PREFIXES = ["/projects", "/issues", "/board", "/dashboard", "/search", "/notifications"];
const PUBLIC_ONLY = ["/login", "/register"];

export default auth((req) => {
    const pathname = req.nextUrl.pathname;

    if (STATIC_EXT.test(pathname)) {
        return NextResponse.next();
    }

    const isLoggedIn = !!req.auth;
    const isPublicOnly = PUBLIC_ONLY.includes(pathname);
    const isProtected = PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
    );

    if (isLoggedIn && isPublicOnly) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (!isLoggedIn && isProtected) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
