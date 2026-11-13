// ayaan(AI Tool 작업·토큰 관리) mock — router.ts 가 registerAyaanMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
import type {MockResult} from "./router";
import type {AyaanPermission, AyaanRequest, AyaanSkill, AyaanTask, AyaanTaskDetail, AyaanTool, AyaanWorkspace, ConfigValues, Quota} from "@/types/ayaan";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const iso = (offsetMin: number) => new Date(Date.now() + offsetMin * 60000).toISOString().replace("Z", "");

const quotas: Quota[] = [
    {toolCd: "CLAUDE", windowCd: "FIVE_HOUR", usedPct: 72, usedTokens: null, limitTokens: null, resetsAt: iso(95), status: "OK", source: "USAGE_API", observedAt: iso(-3)},
    {toolCd: "CLAUDE", windowCd: "WEEK", usedPct: 40, usedTokens: null, limitTokens: null, resetsAt: iso(3000), status: "OK", source: "USAGE_API", observedAt: iso(-3)},
    {toolCd: "CODEX", windowCd: "FIVE_HOUR", usedPct: 100, usedTokens: null, limitTokens: null, resetsAt: iso(30), status: "EXHAUSTED", source: "SESSION_LOG", observedAt: iso(-10)},
];
const tasks: AyaanTask[] = [
    {id: "t1", issueKey: "CIRA-12", source: "WEB", projectKey: "CIRA", workspacePath: "/workspace/d94-query", prompt: null, toolCd: "CLAUDE", exhaustPolicy: "WAIT_SAME_TOOL", fallbackTools: null, status: "RUNNING", cliSessionId: "s1", resumeAt: null, pauseReason: null, resumeCount: 0, resultSummary: null, failReason: null, startedAt: iso(-20), finishedAt: null, createdAt: iso(-25), phase: "DEV", skillCd: null, parentTaskId: null, planDocPath: null},
    {id: "t2", issueKey: "CIRA-7", source: "WEB", projectKey: "CIRA", workspacePath: "/workspace/d94-web", prompt: null, toolCd: "CODEX", exhaustPolicy: "WAIT_SAME_TOOL", fallbackTools: null, status: "PAUSED", cliSessionId: "s2", resumeAt: iso(35), pauseReason: "QUOTA_EXHAUSTED", resumeCount: 1, resultSummary: null, failReason: null, startedAt: iso(-90), finishedAt: null, createdAt: iso(-100), phase: "DEV", skillCd: null, parentTaskId: null, planDocPath: null},
    {id: "t3", issueKey: "CIRA-20", source: "WEB", projectKey: "CIRA", workspacePath: "/workspace/d94-app", prompt: null, toolCd: "CLAUDE", exhaustPolicy: null, fallbackTools: null, status: "WAITING", cliSessionId: "s3", resumeAt: null, pauseReason: null, resumeCount: 0, resultSummary: null, failReason: null, startedAt: iso(-15), finishedAt: null, createdAt: iso(-16), phase: "PLAN", skillCd: null, parentTaskId: null, planDocPath: null},
];
const requests: AyaanRequest[] = [
    {id: "q1", taskId: "t3", kind: "QUESTION", status: "OPEN", question: "인증은 세션과 JWT 중 무엇으로 할까요?", options: ["세션", "JWT"], recommend: 1, context: "[mock] 기존 서비스가 JWT 사용", answer: null, decision: null, answeredBy: null, answeredAt: null, createdAt: iso(-5)},
];
const skills: AyaanSkill[] = [
    {skillCd: "BRAINSTORM", skillNm: "Brainstorming", toolCd: "CLAUDE", phase: "PLAN", invokeText: "/superpowers:brainstorming", pluginRef: "superpowers@superpowers-marketplace", description: "요구사항을 묻고 정리해 설계서를 쓴다", enabled: true, sortNo: 10},
    {skillCd: "PONYTAIL", skillNm: "Ponytail", toolCd: "CLAUDE", phase: "DEV", invokeText: "/ponytail:ponytail", pluginRef: "ponytail@ponytail", description: "최소 구현 성향으로 개발한다", enabled: true, sortNo: 20},
];
let permissions: AyaanPermission[] = [
    {id: "p1", toolCd: "*", category: "SHELL", matcher: "*", decision: "ALLOW", priority: 0, description: "셸 명령 허용"},
    {id: "p2", toolCd: "*", category: "GIT_PUSH", matcher: "*", decision: "ASK", priority: 0, description: "git push 는 승인 필요"},
    {id: "p3", toolCd: "*", category: "FILE_WRITE", matcher: "**/.env*", decision: "DENY", priority: 10, description: ".env 파일 쓰기 금지"},
];
const detail = (t: AyaanTask): AyaanTaskDetail => ({
    ...t,
    runs: [{id: "r1", runSeq: 1, toolCd: t.toolCd, outcome: t.status === "PAUSED" ? "QUOTA_EXHAUSTED" : null, inputTokens: 12000, outputTokens: 3400, cacheReadTokens: 80000, cacheWriteTokens: 5000, costUsd: 0.42, exitCode: null, startedAt: t.startedAt, endedAt: null}],
    tokenTotals: {input: 12000, output: 3400, cacheRead: 80000, cacheWrite: 5000, costUsd: 0.42},
    logTail: "[mock] 작업 로그 마지막 줄들...",
    requests: requests.filter((r) => r.taskId === t.id),
});
const config: ConfigValues = {
    EXHAUST_POLICY: "WAIT_SAME_TOOL", FALLBACK_TOOL_ORDER: "CLAUDE,CODEX,GEMINI,CURSOR", RESUME_CHECK_INTERVAL_SEC: "60",
    RESUME_GRACE_SEC: "120", MAX_RESUME_COUNT: "10", TASK_TIMEOUT_SEC: "1800", QUOTA_POLL_INTERVAL_SEC: "300",
    CLAUDE_USAGE_POLL: "true", REPORT_CRON: "0 9,18 * * *", NOTIFY_EVENTS: "PAUSED,RESUMED,DONE,FAILED,QUOTA_EXHAUSTED,QUOTA_RESTORED",
    CLAUDE_PLUGINS: "ponytail@ponytail|https://github.com/JCAO98/PonyTaill_AgentSkill.git",
    DEFAULT_PROJECT_KEY: "CIRA",
};
const tools: AyaanTool[] = (["CLAUDE", "CODEX", "GEMINI", "CURSOR"] as const).map((toolCd) => ({
    toolCd, enabled: toolCd === "CLAUDE", authMode: "ACCOUNT", planName: toolCd === "CLAUDE" ? "Max 5x" : null, apiKeyRef: null,
    model: null, maxConcurrency: 1, fallbackResetRule: "INTERVAL 30m", budgetTokens: null, budgetPeriod: null,
    planSkillCd: toolCd === "CLAUDE" ? "BRAINSTORM" : null, devSkillCd: toolCd === "CLAUDE" ? "PONYTAIL" : null,
}));
const workspaces: AyaanWorkspace[] = [
    {projectKey: "CIRA", workspacePath: "/workspace/d94-query", defaultTool: "CLAUDE", promptTemplate: "CIRA 이슈 {issueKey}: {title}\n\n{content}"},
];

export function registerAyaanMock(on: On) {
    const B = "/v1/ayaan";
    on("GET", `${B}/quotas`, () => ok({quotas, warnings: ["[mock] Claude usage 조회 실패 — 실행 결과로만 갱신합니다."]}));
    on("POST", `${B}/quotas/refresh`, () => ok({quotas, warnings: []}));
    on("GET", `${B}/tasks`, ({query}) => ok(tasks.filter((t) => (!query.get("status") || t.status === query.get("status")) && (!query.get("tool") || t.toolCd === query.get("tool")))));
    on("POST", `${B}/tasks`, ({body}) => {
        const t: AyaanTask = {...tasks[0], id: `t${tasks.length + 1}`, issueKey: (body.issueKey as string) ?? null, prompt: (body.prompt as string) ?? null, status: "QUEUED", createdAt: iso(0), startedAt: null, phase: (body.phase as AyaanTask["phase"]) ?? "PLAN", skillCd: (body.skillCd as string) ?? null};
        tasks.unshift(t);
        return ok(t);
    });
    on("GET", `${B}/tasks/:id`, ({params}) => {
        const t = tasks.find((x) => x.id === params.id);
        return t ? ok(detail(t)) : {status: 404, body: {success: false, error: "task not found (mock)"}};
    });
    on("POST", `${B}/tasks/:id/resume`, ({params}) => {
        const t = tasks.find((x) => x.id === params.id);
        if (t) t.status = "QUEUED";
        return ok(t);
    });
    on("POST", `${B}/tasks/:id/cancel`, ({params}) => {
        const t = tasks.find((x) => x.id === params.id);
        if (t) t.status = "CANCELLED";
        return ok(t);
    });
    on("GET", `${B}/config`, () => ok(config));
    on("PUT", `${B}/config`, ({body}) => {
        Object.assign(config, body);
        return ok(config);
    });
    on("GET", `${B}/tools`, () => ok(tools));
    on("PUT", `${B}/tools/:cd`, ({params, body}) => {
        const i = tools.findIndex((t) => t.toolCd === params.cd);
        if (i >= 0) tools[i] = body as unknown as AyaanTool;
        return ok(tools[i]);
    });
    on("GET", `${B}/workspaces`, () => ok(workspaces));
    on("PUT", `${B}/workspaces/:key`, ({params, body}) => {
        const w = body as unknown as AyaanWorkspace;
        const i = workspaces.findIndex((x) => x.projectKey === params.key);
        if (i >= 0) workspaces[i] = w; else workspaces.push(w);
        return ok(w);
    });
    on("DELETE", `${B}/workspaces/:key`, ({params}) => {
        const i = workspaces.findIndex((x) => x.projectKey === params.key);
        if (i >= 0) workspaces.splice(i, 1);
        return ok(null);
    });
    on("GET", `${B}/skills`, () => ok(skills));
    on("PUT", `${B}/skills/:cd`, ({params, body}) => {
        const sk = {...(body as unknown as AyaanSkill), skillCd: params.cd};
        const i = skills.findIndex((x) => x.skillCd === params.cd);
        if (i >= 0) skills[i] = sk; else skills.push(sk);
        return ok({skill: sk, warnings: sk.pluginRef && !config.CLAUDE_PLUGINS.includes(sk.pluginRef) ? ["CLAUDE_PLUGINS에 없음"] : []});
    });
    on("DELETE", `${B}/skills/:cd`, ({params}) => {
        const i = skills.findIndex((x) => x.skillCd === params.cd);
        if (i >= 0) skills.splice(i, 1);
        return ok(null);
    });
    on("GET", `${B}/permissions`, () => ok(permissions));
    on("PUT", `${B}/permissions`, ({body}) => {
        permissions = (body as unknown as AyaanPermission[]).map((p, i) => ({...p, id: `p${i + 1}`}));
        return ok(permissions);
    });
    on("GET", `${B}/requests`, ({query}) => ok(requests.filter((r) => (!query.get("status") || r.status === query.get("status")) && (!query.get("taskId") || r.taskId === query.get("taskId")))));
    on("POST", `${B}/requests/:id/answer`, ({params, body}) => {
        const r = requests.find((x) => x.id === params.id);
        if (!r || r.status !== "OPEN") return {status: 409, body: {success: false, data: r}};
        r.status = "ANSWERED";
        r.answer = typeof body.choice === "number" ? r.options[body.choice] : String(body.answer ?? "");
        r.answeredBy = "web:mock";
        r.answeredAt = iso(0);
        const t = tasks.find((x) => x.id === r.taskId);
        if (t) t.status = "QUEUED";
        return ok(r);
    });
    on("POST", `${B}/tasks/:id/dev-task`, ({params}) => ok({...tasks[0], id: `t${tasks.length + 1}`, status: "WAITING", phase: "DEV", parentTaskId: params.id}));
    on("GET", `${B}/setup/check`, () => ok([1, 2, 3, 4, 5, 6, 7].map((step) => ({
        step, ok: step !== 2, items: [{name: `step${step} 점검`, ok: step !== 2, detail: step === 2 ? "변수 없음 (mock)" : ""}],
    }))));
    on("POST", `${B}/setup/test-notify`, () => ok(true));
    on("POST", `${B}/plugins/sync`, () => ok([
        {plugin: "ponytail@ponytail", ok: true, detail: "설치됨"},
        {plugin: "superpowers@superpowers-marketplace", ok: true, detail: "설치됨"},
    ]));
    on("GET", `${B}/plugins`, () => ok({output: "ponytail@ponytail (mock)\nsuperpowers@superpowers-marketplace (mock)"}));
}
