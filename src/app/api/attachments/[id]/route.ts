import {getBackendAccessToken} from "@/lib/auth/accessToken";
import {isMockEnabled} from "@/lib/mock/enabled";
import {NextResponse} from "next/server";

/** UMD 응답 본문 상한(5MB)보다 작게 — 한 번에 이만큼씩 Range 로 받는다 */
const CHUNK_BYTES = 4 * 1024 * 1024;
const BACKEND_TIMEOUT_MS = 35_000;

// ponytail: 60초(Hobby 기본 상한). 50MB = 13번 왕복이라 UMD 가 느리면 끊길 수 있음 → 그때 올릴 것
export const maxDuration = 60;

/**
 * 첨부 보기·다운로드. 백엔드에 Range 로 4MB씩 차례로 요청해 브라우저에는 하나의 200 응답으로 이어 보낸다.
 * (/api/proxy 는 응답을 그대로 넘기므로 5MB 넘는 파일은 UMD 가 502 RESPONSE_TOO_LARGE 를 준다)
 */
export async function GET(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;
    const path = `/v1/attachments/${encodeURIComponent(id)}/download`;

    // TODO: 임시 - mock 모드는 프록시의 mock 다운로드로 (작은 샘플 파일)
    if (isMockEnabled()) {
        return NextResponse.redirect(new URL(`/api/proxy${path}`, request.url), 307);
    }

    // 백엔드 토큰은 서버에서만 세션 쿠키에서 꺼낸다 (ADR 0005)
    const accessToken = await getBackendAccessToken(request);
    const fetchRange = (start: number) =>
        fetch(`${process.env.BACKEND_URL}${path}`, {
            headers: {
                ...(accessToken ? {authorization: `Bearer ${accessToken}`} : {}),
                range: `bytes=${start}-${start + CHUNK_BYTES - 1}`,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
        });

    let first: Response;
    try {
        first = await fetchRange(0);
    } catch (error) {
        console.error(`Attachment download error (${id}):`, error);
        return NextResponse.json({success: false, error: "Backend unreachable"}, {status: 502});
    }
    const total = Number(first.headers.get("content-range")?.split("/")[1]);
    // 206 이 아니면(오류, Range 미지원 백엔드) 그대로 넘긴다
    if (first.status !== 206 || !first.body || !Number.isFinite(total)) {
        return new Response(first.body, {status: first.status, headers: pick(first.headers, ["content-type", "content-disposition"])});
    }

    let offset = 0;
    let reader = first.body.getReader();
    const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
            for (; ;) {
                const {done, value} = await reader.read();
                if (!done) {
                    offset += value.byteLength;
                    controller.enqueue(value);
                    return;
                }
                if (offset >= total) {
                    controller.close();
                    return;
                }
                const next = await fetchRange(offset);
                if (next.status !== 206 || !next.body) {
                    controller.error(new Error(`range ${offset} → ${next.status}`));
                    return;
                }
                reader = next.body.getReader();
            }
        },
        cancel: () => reader.cancel(),
    });

    const headers = pick(first.headers, ["content-type", "content-disposition"]);
    headers.set("content-length", String(total));
    return new Response(body, {status: 200, headers});
}

function pick(from: Headers, names: string[]) {
    const out = new Headers();
    for (const n of names) {
        const v = from.get(n);
        if (v) out.set(n, v);
    }
    return out;
}
