// API 토큰 mock — router.ts 가 registerApiTokenMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
import type {MockResult} from "./router";
import type {ApiToken} from "@/types/apiToken";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, code: string, message: string): MockResult => ({status, body: {success: false, code, message}});
const SERVICES = ["all", "cira", "docs", "study", "interface-test"];

const tokens: ApiToken[] = [];
const enabled: Record<string, boolean> = {};
let seq = 0;

const now = () => new Date().toISOString().slice(0, 19);
const services = () => SERVICES.map((service) => ({service, enabled: enabled[service] ?? true}));

export function registerApiTokenMock(on: On) {
    on("GET", "/v1/api-tokens", () => ok(tokens));
    on("POST", "/v1/api-tokens", ({body}) => {
        const service = String(body.service ?? "").toLowerCase();
        const name = String(body.name ?? "").trim();
        if (!SERVICES.includes(service)) return fail(400, "BAD_REQUEST", `지원하지 않는 서비스입니다: ${service}`);
        if (!name || name.length > 100) return fail(400, "BAD_REQUEST", "토큰 이름은 1~100자여야 합니다.");
        if (enabled[service] === false) return fail(403, "FORBIDDEN", "권한이 없습니다.");
        const days = Number(body.expiresInDays ?? 90);
        const random = Array.from({length: 43}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
        const raw = `d94_${service}_${random}`;
        const info: ApiToken = {
            id: `tok-${++seq}`, name, service, access: body.access === "WRITE" ? "WRITE" : "READ", prefix: raw.slice(0, 12),
            expiresAt: new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 19), lastUsedAt: null, createdAt: now(),
        };
        tokens.unshift(info);
        return {status: 201, body: {success: true, code: "201", data: {token: raw, info}}};
    });
    on("DELETE", "/v1/api-tokens/:id", ({params}) => {
        const i = tokens.findIndex((t) => t.id === params.id);
        if (i < 0) return fail(404, "NOT_FOUND", "토큰을 찾을 수 없습니다.");
        tokens.splice(i, 1);
        return {status: 204};
    });
    on("GET", "/v1/api-tokens/services", () => ok(services()));
    on("PUT", "/v1/api-tokens/services/:service", ({params, body}) => {
        enabled[params.service] = Boolean(body.enabled);
        return ok(services());
    });
}
