// @vitest-environment node
/**
 * mock 라우터(DEV_MOCK_API) 응답 모양을 d94-query 실제 모양(src/test/msw/fixtures)과 비교한다.
 * mock 은 web 타입으로 만들어져 있어 백엔드와 다른 곳이 있다 → 차이를 KNOWN_DIFFS 로 고정해 두고,
 * mock·백엔드·web 중 하나가 바뀌면 이 테스트가 깨져서 목록을 다시 보게 한다. 목록 설명: docs/test-report.md
 */
import * as fx from "@/test/msw/fixtures";
import {describe, expect, it} from "vitest";
import {handleMockRequest} from "./router";

type Json = unknown;

async function call(method: string, path: string, body?: unknown): Promise<{status: number; body: Json}> {
    const init: RequestInit = {method};
    if (body !== undefined) {
        init.body = JSON.stringify(body);
        init.headers = {"content-type": "application/json"};
    }
    const [pathname, search = ""] = path.split("?");
    const req = new Request(`http://localhost/api/proxy${pathname}${search ? `?${search}` : ""}`, init);
    const res = await handleMockRequest(req, pathname.split("/").filter(Boolean));
    return {status: res.status, body: res.body};
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** 배열이면 모든 원소 키의 합집합으로 대표 객체를 만든다 (선택 필드가 샘플에 없어서 생기는 거짓 차이 방지) */
function representative(v: unknown): unknown {
    if (!Array.isArray(v)) return v;
    const objs = v.filter(isObj);
    if (objs.length === 0) return v[0];
    return objs.reduce<Record<string, unknown>>((acc, o) => {
        for (const [k, val] of Object.entries(o)) if (!(k in acc) || acc[k] == null) acc[k] = val;
        return acc;
    }, {});
}

/**
 * 키 차이: "-a.b" = 백엔드에만 있음, "+a.b" = mock 에만 있음, "~a.b" = 형태(객체/배열/원시) 다름
 */
function shapeDiff(mock: unknown, backend: unknown, prefix = ""): string[] {
    const m = representative(mock);
    const b = representative(backend);
    const kind = (v: unknown) => (Array.isArray(v) ? "array" : isObj(v) ? "object" : v == null ? "null" : "value");
    const mk = Array.isArray(mock) ? "array" : kind(m);
    const bk = Array.isArray(backend) ? "array" : kind(b);
    if (mk === "null" || bk === "null") return [];
    if (mk !== bk) return [`~${prefix || "(root)"}: mock ${mk} / backend ${bk}`];
    if (!isObj(m) || !isObj(b)) return [];
    const out: string[] = [];
    const sub = Array.isArray(mock) ? "[]" : "";
    for (const k of Object.keys(b)) if (!(k in m)) out.push(`-${prefix}${sub}${prefix || sub ? "." : ""}${k}`.replace("[].", "[]."));
    for (const k of Object.keys(m)) if (!(k in b)) out.push(`+${prefix}${sub}${prefix || sub ? "." : ""}${k}`);
    for (const k of Object.keys(b)) {
        if (k in m) out.push(...shapeDiff(m[k], b[k], `${prefix}${sub}${prefix || sub ? "." : ""}${k}`));
    }
    return out.sort();
}

const dataOf = (r: {body: Json}) => (r.body as {data?: unknown}).data;

describe("mock 라우터 vs d94-query 응답 모양", () => {
    it("응답 래퍼: mock 은 {success, data}, 백엔드는 {success, code, message, data}", async () => {
        const r = await call("GET", "/v1/projects");
        expect(Object.keys(r.body as object).sort()).toEqual(["data", "success"]);
        expect(Object.keys(fx.ok(null)).sort()).toEqual(["code", "data", "message", "success"]);
    });

    it("삭제 응답: mock 은 data:null, 백엔드는 data 키 없음 (noContent)", async () => {
        const boards = dataOf(await call("GET", "/v1/projects/1/boards")) as {id: string}[];
        const r = await call("DELETE", `/v1/boards/${boards[boards.length - 1].id}`);
        expect(r.body).toEqual({success: true, data: null});
        expect(fx.noContent()).not.toHaveProperty("data");
    });

    it("엔드포인트별 키 차이가 KNOWN_DIFFS 와 같다", async () => {
        const boards = dataOf(await call("GET", "/v1/projects/1/boards")) as {id: string}[];
        const sprints = dataOf(await call("GET", "/v1/projects/1/sprints")) as {id: string}[];
        const issuesPage = dataOf(await call("GET", "/v1/projects/1/issues")) as {content: {id: string}[]};
        const issueId = "i-11";

        const pairs: Record<string, [unknown, unknown]> = {
            "GET /v1/projects": [dataOf(await call("GET", "/v1/projects")), [fx.project]],
            "GET /v1/projects/:id/issues": [issuesPage, fx.page([fx.issue1])],
            "GET /v1/issues/:id": [dataOf(await call("GET", `/v1/issues/${issueId}`)), fx.issue1],
            "GET /v1/issues/:id/available-transitions": [
                dataOf(await call("GET", `/v1/issues/${issuesPage.content[0].id}/available-transitions`)), fx.transitions],
            "GET /v1/projects/:id/boards": [boards, [fx.board]],
            "GET /v1/boards/:id": [dataOf(await call("GET", `/v1/boards/${boards[0].id}`)), fx.boardDetail()],
            "GET /v1/projects/:id/sprints": [sprints, [fx.sprint]],
            "GET /v1/issues/:id/comments": [dataOf(await call("GET", `/v1/issues/${issueId}/comments`)), [fx.comment]],
            "GET /v1/notifications": [dataOf(await call("GET", "/v1/notifications")), fx.notifications()],
            "GET /v1/notifications/unread-count": [dataOf(await call("GET", "/v1/notifications/unread-count")), {count: 1}],
            "GET /v1/users/search": [dataOf(await call("GET", "/v1/users/search?keyword=")), fx.userSearch],
            "GET /v1/projects/:id/members": [dataOf(await call("GET", "/v1/projects/1/members")), fx.members],
            "GET /v1/projects/:id/workflow/statuses": [
                dataOf(await call("GET", "/v1/projects/1/workflow/statuses")), fx.workflowStatuses],
        };
        const diffs = Object.fromEntries(
            Object.entries(pairs).map(([k, [m, b]]) => [k, shapeDiff(m, b)]).filter(([, d]) => (d as string[]).length > 0),
        );
        expect(diffs).toEqual(KNOWN_DIFFS);
    });

    it("댓글·멤버 엔드포인트가 백엔드와 같다 (/v1/comments/{id}, 반응 POST 토글, /members/{userId}/role)", async () => {
        const comments = dataOf(await call("GET", "/v1/issues/i-11/comments")) as {id: string}[];
        const id = comments[0].id;
        expect((await call("PUT", `/v1/comments/${id}`, {content: "x"})).status).toBe(200);
        // 토글: 두 번 누르면 원래대로
        // mock 은 저장소 객체를 그대로 돌려주므로 길이를 먼저 적어 둔다
        const beforeLen = ((comments[0] as {reactions?: unknown[]}).reactions ?? []).length;
        const once = dataOf(await call("POST", `/v1/comments/${id}/reactions`, {reactionType: "🚀"})) as {reactions: {reactionType: string}[]};
        expect(once.reactions.map((r) => r.reactionType)).toContain("🚀");
        const twice = dataOf(await call("POST", `/v1/comments/${id}/reactions`, {reactionType: "🚀"})) as {reactions: unknown[]};
        expect(twice.reactions).toHaveLength(beforeLen);
        expect((await call("POST", `/v1/comments/${id}/reactions`, {emoji: "🚀"})).status).toBe(400);
        // 예전 web 경로는 더 이상 없다
        expect((await call("PUT", `/v1/issues/i-11/comments/${id}`, {content: "x"})).status).toBe(404);
        expect((await call("DELETE", `/v1/comments/${id}/reactions/${encodeURIComponent("👍")}`)).status).toBe(404);
        expect((await call("PUT", "/v1/projects/1/members/u-3/role", {role: "ADMIN"})).status).toBe(200);
        expect((await call("DELETE", `/v1/comments/${id}`)).status).toBe(200);
    });

    it("mock 은 statusId·issueTypeId 없이도 만들고, 이메일 assigneeId 로 담당자를 채운다 (백엔드는 500 / 담당자 null)", async () => {
        const r = await call("POST", "/v1/projects/1/issues", {title: "t", assigneeId: "minjun.kim@cira.dev"});
        expect(r.status).toBe(200);
        expect(dataOf(r)).toMatchObject({assignee: {email: "minjun.kim@cira.dev"}});
        expect(dataOf(r)).toHaveProperty("statusId");
    });

    it("스프린트 상태 값: mock 도 백엔드와 같은 Planned/Active/Completed", async () => {
        const sprints = dataOf(await call("GET", "/v1/projects/1/sprints")) as {sprintStat: string}[];
        for (const s of sprints) expect(["Planned", "Active", "Completed"]).toContain(s.sprintStat);
        expect(["Planned", "Active", "Completed"]).toContain(fx.sprint.sprintStat);
    });

    it("mock 은 255자 넘는 이슈 설명도 저장한다 (백엔드 varchar(255) → 500)", async () => {
        const r = await call("POST", "/v1/projects/1/issues", {title: "t", content: "가".repeat(300)});
        expect(r.status).toBe(200);
    });
});

/** 2026-10-31 기준 차이 (설명: docs/test-report.md §mock 라우터 차이) */
const KNOWN_DIFFS: Record<string, string[]> = {
    // BoardIssueResponse.rankStr 를 mock 이 만들지 않는다
    "GET /v1/boards/:id": ["-columns[].issues[].rankStr"],
    // UserResponse.avatarUrl: 백엔드는 null 로라도 보내고 mock 은 키를 뺀다
    "GET /v1/issues/:id": ["-assignee.avatarUrl", "-reporter.avatarUrl"],
    // 최상위 댓글의 parentId(백엔드 null)를 mock 은 뺀다, 답글에 reactions·replies 없음 — web 은 모두 선택 필드로 처리
    "GET /v1/issues/:id/comments": [
        "-[].author.avatarUrl",
        "-[].parentId",
        "-[].replies[].author.avatarUrl",
        "-[].replies[].reactions",
        "-[].replies[].replies",
    ],
    // mock 은 페이지 객체·web 필드(isRead·body), 백엔드는 목록(read·message·resourceType…) — lib/api/notifications.ts 가 둘 다 처리
    "GET /v1/notifications": ["~(root): mock object / backend array"],
    // mock 은 숫자, 백엔드는 {count} — getUnreadCount 가 둘 다 처리
    "GET /v1/notifications/unread-count": ["~(root): mock value / backend object"],
    // mock 페이지는 web PageResponse 5개 필드만, 백엔드는 Spring PageImpl 전체
    "GET /v1/projects/:id/issues": [
        "-content[].assignee.avatarUrl",
        "-content[].reporter.avatarUrl",
        "-empty",
        "-first",
        "-last",
        "-numberOfElements",
        "-pageable",
        "-sort",
    ],
    // ProjectMemberResponse.avatarUrl: 백엔드는 null 로라도 보내고 mock 은 키를 뺀다
    "GET /v1/projects/:id/members": ["-[].avatarUrl"],
    // UserSearchResponse.id 를 mock 이 주지 않는다 (web 은 멘션에 email 만 쓴다. 담당자는 멤버 목록의 userId)
    "GET /v1/users/search": ["-[].avatarUrl", "-[].id"],
};
