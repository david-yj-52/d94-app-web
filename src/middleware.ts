import {auth} from "@/auth";
import {classifyPath} from "@/lib/routeAccess";
import {NextResponse} from "next/server";

const STATIC_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|css|js)$/i;

export default auth((req) => {
    const pathname = req.nextUrl.pathname;

    if (STATIC_EXT.test(pathname)) {
        return NextResponse.next();
    }

    const isLoggedIn = !!req.auth;
    const access = classifyPath(pathname);

    if (isLoggedIn && access === "publicOnly") {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    if (!isLoggedIn && access === "protected") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
