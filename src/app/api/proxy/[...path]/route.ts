import {auth} from "@/auth";
import {NextResponse} from "next/server";
import {handleMockRequest, isMockEnabled} from "@/lib/mock/router";

const API_BASE_URL = process.env.BACKEND_URL;

/** UMD(30초)보다 길게 — 프록시가 먼저 끊어 상태코드를 잃지 않도록 (UMD ui-guide §4-3) */
const BACKEND_TIMEOUT_MS = 35_000;

/** 브라우저 → 백엔드로 그대로 넘기는 요청 헤더. Authorization 은 세션 토큰으로 따로 붙인다. */
const PASS_REQUEST_HEADERS = [
    "accept",
    "accept-language",
    "content-type",
    "if-none-match",
    "if-modified-since",
    "idempotency-key",
];

/** hop-by-hop · 길이 헤더는 Next 가 다시 계산한다. content-encoding 은 fetch 가 이미 풀어 둔 본문과 맞지 않는다. */
const DROP_RESPONSE_HEADERS = ["connection", "keep-alive", "transfer-encoding", "content-length", "content-encoding"];

/** 본문이 없어야 하는 상태코드 */
const NULL_BODY_STATUS = [204, 205, 304];

/**
 * 백엔드 투명 프록시: 메서드·쿼리·본문을 그대로 보내고, 응답 상태·헤더·본문을 그대로 돌려준다.
 * 타임아웃은 504, 연결 실패는 502 로 바꾼다.
 */
async function proxyHandler(
    request: Request,
    {params}: { params: Promise<{ path: string[] }> },
) {
    const resolvedParams = await params;

    // TODO: 임시 - DEV_MOCK_API=true 이면 백엔드 대신 Mock 데이터로 응답 (백엔드 복구 후 제거)
    if (isMockEnabled()) {
        const mock = await handleMockRequest(request, resolvedParams.path);
        if (mock.raw) return mock.raw;
        if (NULL_BODY_STATUS.includes(mock.status)) return new Response(null, {status: mock.status});
        return NextResponse.json(mock.body ?? {success: true, data: null}, {status: mock.status});
    }

    const url = new URL(request.url);
    const targetPath = `/${resolvedParams.path.join("/")}${url.search}`;
    const method = request.method;

    const session = await auth();

    const headers = new Headers();
    for (const name of PASS_REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }
    if (session?.user?.accessToken) {
        headers.set("authorization", `Bearer ${session.user.accessToken}`);
    }
    const clientIp = request.headers.get("x-forwarded-for");
    if (clientIp) headers.set("x-forwarded-for", clientIp);

    const hasBody = method !== "GET" && method !== "HEAD";
    // duplex: Node fetch 로 스트림 본문을 보낼 때 필요 (DOM RequestInit 타입에는 없음)
    const init: RequestInit & { duplex?: "half" } = {
        method,
        headers,
        body: hasBody ? request.body : undefined,
        duplex: hasBody ? "half" : undefined,
        signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        cache: "no-store",
    };

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${targetPath}`, init);
    } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "TimeoutError";
        console.error(`Proxy Error (${method} ${targetPath}):`, error);
        return NextResponse.json(
            {success: false, error: timedOut ? "Backend timeout" : "Backend unreachable"},
            {status: timedOut ? 504 : 502},
        );
    }

    const outHeaders = new Headers(res.headers);
    DROP_RESPONSE_HEADERS.forEach((h) => outHeaders.delete(h));
    const body = NULL_BODY_STATUS.includes(res.status) || method === "HEAD" ? null : res.body;
    return new Response(body, {status: res.status, statusText: res.statusText, headers: outHeaders});
}

export {
    proxyHandler as GET,
    proxyHandler as POST,
    proxyHandler as PUT,
    proxyHandler as PATCH,
    proxyHandler as DELETE,
    proxyHandler as HEAD,
};
