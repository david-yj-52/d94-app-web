import {afterEach, describe, expect, it, vi} from "vitest";
import {GET} from "./route";

vi.mock("@/lib/auth/accessToken", () => ({getBackendAccessToken: async () => "tok"}));
vi.mock("@/lib/mock/enabled", () => ({isMockEnabled: () => false}));

const MB = 1024 * 1024;
const file = new Uint8Array(9 * MB);
for (let i = 0; i < file.length; i++) file[i] = i % 251;

/** 백엔드 흉내: Range 구간만 206 으로 */
function backend(req: string | URL | Request, init?: RequestInit) {
    const range = new Headers(init?.headers).get("range")!;
    const [s, e] = range.replace("bytes=", "").split("-").map(Number);
    const end = Math.min(e, file.length - 1);
    return Promise.resolve(new Response(file.slice(s, end + 1), {
        status: 206,
        headers: {"content-range": `bytes ${s}-${end}/${file.length}`, "content-type": "application/zip"},
    }));
}

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/attachments/[id]", () => {
    it("4MB씩 Range 로 받아 하나의 200 응답으로 잇는다 (UMD 5MB 상한 우회)", async () => {
        const fetchMock = vi.fn(backend);
        vi.stubGlobal("fetch", fetchMock);

        const res = await GET(new Request("http://x/api/attachments/a-1"), {params: Promise.resolve({id: "a-1"})});
        const body = new Uint8Array(await res.arrayBuffer());

        expect(res.status).toBe(200);
        expect(res.headers.get("content-length")).toBe(String(file.length));
        expect(fetchMock).toHaveBeenCalledTimes(3); // 0-4MB, 4-8MB, 8-9MB
        expect(Buffer.compare(body, file)).toBe(0);
        expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer tok");
    });

    it("백엔드 오류(206 아님)는 상태 그대로 넘긴다", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", {status: 404, headers: {"content-type": "application/json"}})));
        const res = await GET(new Request("http://x/api/attachments/a-9"), {params: Promise.resolve({id: "a-9"})});
        expect(res.status).toBe(404);
    });
});
