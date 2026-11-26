// life_metric mock — router.ts 가 registerLifeMetricMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
// ponytail: 수식 계산은 d94-query LifeMetricFormulaEngine 만 한다 — mock 은 value=null 과 안내 error 로 답한다.
import type {MockResult} from "./router";
import type {Metric, MetricLog, MetricTemplate} from "@/types/lifeMetric";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, code: string, message: string): MockResult => ({status, body: {success: false, code, message}});
const notFound = fail(404, "LIFE_METRIC_NOT_FOUND", "존재하지 않습니다.");
const MOCK_ERROR = "mock 모드에서는 계산하지 않습니다 (d94-query 필요)";

const TEMPLATES: MetricTemplate[] = [
    {id: "lmt-hourly-wage", code: "hourly_wage", name: "내 시급", outputUnit: "원/시간", defaultFormula: "annual_salary / (weekly_hours * 52)",
        inputSchema: [{key: "annual_salary", label: "연봉", type: "NUMBER", unit: "원", mode: "BASELINE"},
            {key: "weekly_hours", label: "주당 근무시간", type: "NUMBER", unit: "시간", mode: "BASELINE"}]},
    {id: "lmt-remaining-life", code: "remaining_life", name: "남은 수명(일)", outputUnit: "일",
        defaultFormula: "life_expectancy * 365.2425 - daysBetween(birth_date, now())",
        inputSchema: [{key: "birth_date", label: "생년월일", type: "DATE", mode: "BASELINE"},
            {key: "life_expectancy", label: "기대수명", type: "NUMBER", unit: "세", mode: "BASELINE"}]},
];

const g = globalThis as unknown as { __lifeMetricMock?: { metrics: Metric[]; logs: Record<string, MetricLog[]>; seq: number } };
const store = () => (g.__lifeMetricMock ??= {metrics: [], logs: {}, seq: 1});
const now = () => new Date().toISOString().slice(0, 19);

export function registerLifeMetricMock(on: On) {
    on("GET", "/v1/life-metric/templates", () => ok(TEMPLATES));
    on("GET", "/v1/life-metric/metrics", () => ok(store().metrics));
    on("GET", "/v1/life-metric/metrics/:id", ({params}) => {
        const m = store().metrics.find((x) => x.id === params.id);
        return m ? ok(m) : notFound;
    });
    on("POST", "/v1/life-metric/metrics", ({body}) => {
        const s = store();
        const code = String(body.code ?? "");
        if (!/^[a-z][a-z0-9_]{0,49}$/.test(code)) return fail(400, "LIFE_METRIC_INVALID_REQUEST", "코드 형식이 올바르지 않습니다.");
        if (s.metrics.some((m) => m.code === code)) return fail(409, "LIFE_METRIC_DUPLICATE_CODE", "같은 코드의 지표가 이미 있습니다.");
        const t = TEMPLATES.find((x) => x.id === body.templateId);
        const useT = t && !body.formula;
        const m: Metric = {
            id: `lm-${s.seq++}`, templateId: t?.id ?? null, code, name: String(body.name || t?.name || code),
            inputSchema: useT ? t.inputSchema : (body.inputSchema as Metric["inputSchema"]) ?? [],
            formula: useT ? t.defaultFormula : String(body.formula ?? ""),
            outputUnit: useT ? t.outputUnit : (body.outputUnit as string) ?? null,
            inputs: {}, value: null, error: MOCK_ERROR, createdAt: now(), modifiedAt: now(),
        };
        s.metrics.push(m);
        return ok(m);
    });
    on("PUT", "/v1/life-metric/metrics/:id", ({params, body}) => {
        const m = store().metrics.find((x) => x.id === params.id);
        if (!m) return notFound;
        Object.assign(m, Object.fromEntries(Object.entries(body).filter(([k, v]) =>
            v != null && ["name", "inputSchema", "formula", "outputUnit"].includes(k))), {modifiedAt: now()});
        return ok(m);
    });
    on("DELETE", "/v1/life-metric/metrics/:id", ({params}) => {
        const s = store();
        s.metrics = s.metrics.filter((x) => x.id !== params.id);
        return {status: 200, body: {success: true}};
    });
    on("PUT", "/v1/life-metric/metrics/:id/inputs", ({params, body}) => {
        const m = store().metrics.find((x) => x.id === params.id);
        if (!m) return notFound;
        for (const [k, v] of Object.entries((body.values ?? {}) as Record<string, number | string | null>)) {
            if (v == null || v === "") delete m.inputs[k];
            else m.inputs[k] = v;
        }
        return ok(m);
    });
    on("GET", "/v1/life-metric/metrics/:id/logs", ({params}) => ok(store().logs[params.id] ?? []));
    on("POST", "/v1/life-metric/metrics/:id/logs", ({params, body}) => {
        const s = store();
        const log: MetricLog = {id: s.seq++, inputKey: String(body.inputKey), value: Number(body.value),
            note: (body.note as string) ?? null, recordedAt: (body.recordedAt as string) ?? now()};
        (s.logs[params.id] ??= []).unshift(log);
        return ok(log);
    });
    on("DELETE", "/v1/life-metric/metrics/:id/logs/:logId", ({params}) => {
        const s = store();
        s.logs[params.id] = (s.logs[params.id] ?? []).filter((l) => String(l.id) !== params.logId);
        return {status: 200, body: {success: true}};
    });
    on("GET", "/v1/life-metric/metrics/:id/evaluate", () => ok({value: null, unit: null, error: MOCK_ERROR}));
    on("POST", "/v1/life-metric/preview", () => ok({value: null, unit: null, error: MOCK_ERROR}));
}
