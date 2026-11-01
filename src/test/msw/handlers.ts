/**
 * d94-query 엔드포인트를 흉내 내는 MSW 핸들러.
 * - 경로·메서드는 d94-query `interfaces/controller/cira/*Controller.java` 에 **실제로 있는 것만** 둔다.
 * - 응답은 ./fixtures 의 백엔드 모양 그대로 `{success, code, message, data}` 로 감싼다.
 * - 없는 엔드포인트는 d94-query 처럼 500 INTERNAL_ERROR 를 준다 (GlobalExceptionHandler 가 NoResourceFoundException 까지 잡음).
 */
import {http, HttpResponse, type JsonBodyType} from "msw";
import * as fx from "./fixtures";

const API = "*/api/proxy/v1";

export interface RecordedRequest {
    method: string;
    path: string;
    query: URLSearchParams;
    body: unknown;
}

/** 테스트가 "무엇을 보냈는지" 확인할 수 있게 모든 요청을 기록한다 (server.ts 가 매 테스트 후 비움) */
export const recorded: RecordedRequest[] = [];

/** 사용자 objId (GS_USER.OBJ_ID). assigneeId 가 가리켜야 하는 값 (d94-query 는 검증 없이 그대로 저장한다) */
export const KNOWN_USER_IDS = ["USR-0001", "USR-0002"];

const json = (body: JsonBodyType, status = 200) => HttpResponse.json(body, {status});
const badRequest = (msg: string) => json(fx.error("VALIDATION_ERROR", msg), 400);
const internalError = () => json(fx.error("INTERNAL_ERROR", "서버 내부 오류가 발생했습니다."), 500);

/** 운영 DB varchar(255) 컬럼에 더 긴 값을 저장하면 d94-query 는 500 (DataIntegrityViolation) */
const tooLong = (body: Record<string, unknown>, field: string) =>
    typeof body[field] === "string" && (body[field] as string).length > fx.VARCHAR_LIMIT;

async function readBody(request: Request): Promise<Record<string, unknown>> {
    if (request.method === "GET" || request.method === "DELETE") return {};
    const text = await request.text();
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

export const handlers = [
    // 기록용 패스스루: 모든 요청을 먼저 기록하고 다음 핸들러로 넘긴다
    http.all(`${API}/*`, async ({request}) => {
        const url = new URL(request.url);
        recorded.push({
            method: request.method,
            path: url.pathname.replace(/^\/api\/proxy/, ""),
            query: url.searchParams,
            body: await readBody(request.clone()),
        });
    }),

    // ProjectController
    http.get(`${API}/projects`, () => json(fx.ok([fx.project]))),
    http.get(`${API}/projects/:projectId`, () => json(fx.ok(fx.project))),
    http.post(`${API}/projects`, async ({request}) => {
        const body = await readBody(request);
        return tooLong(body, "description") ? internalError() : json(fx.ok({...fx.project, ...body}));
    }),
    http.put(`${API}/projects/:projectId`, async ({request}) => {
        const body = await readBody(request);
        return tooLong(body, "description") ? internalError() : json(fx.ok({...fx.project, ...body}));
    }),

    http.get(`${API}/projects/:projectId/members`, () => json(fx.ok(fx.members))),
    http.put(`${API}/projects/:projectId/members/:userId/role`, async ({request, params}) => {
        const body = await readBody(request);
        const m = fx.members.find((x) => x.userId === params.userId) ?? fx.members[0];
        return json(fx.ok({...m, role: String(body.role)}));
    }),
    http.get(`${API}/projects/:projectId/workflow/statuses`, () => json(fx.ok(fx.workflowStatuses))),

    // IssueController
    http.get(`${API}/projects/:projectId/issues`, ({request}) => {
        const q = new URL(request.url).searchParams;
        return json(fx.ok(fx.page([fx.issue1, fx.issue2], Number(q.get("page") ?? 0), Number(q.get("size") ?? 20))));
    }),
    http.post(`${API}/projects/:projectId/issues`, async ({request}) => {
        const body = await readBody(request);
        // statusId·issueTypeId 가 없으면 mapToResponse 의 findByIdOptional(null) 이 트랜잭션을 rollback-only 로 만들어
        // UnexpectedRollbackException → 500 (d94-query 통합 테스트로 확인, 2026-10-31)
        if (!body.statusId || !body.issueTypeId) return internalError();
        if (tooLong(body, "content")) return internalError();
        // ASSIGNEE_ID 는 검증 없이 저장된다. objId 가 아니면 응답 변환에서 사용자를 못 찾아 assignee 가 null
        const assignee = typeof body.assigneeId === "string" && KNOWN_USER_IDS.includes(body.assigneeId) ? fx.userKim : null;
        return json(fx.ok({...fx.issue1, id: "ISS-NEW", issueKey: "CIRA-3", title: String(body.title), assignee}));
    }),
    http.get(`${API}/issues/:issueId`, () => json(fx.ok(fx.issue1))),
    http.put(`${API}/issues/:issueId`, async ({request, params}) => {
        const body = await readBody(request);
        return tooLong(body, "content") ? internalError() : json(fx.ok({...fx.issue1, id: String(params.issueId), ...body}));
    }),
    http.delete(`${API}/issues/:issueId`, () => json(fx.noContent())),
    http.put(`${API}/issues/:issueId/status`, async ({request, params}) => {
        const body = await readBody(request);
        if (!body.statusId) return badRequest("statusId: statusId는 필수입니다.");
        return json(fx.ok({...fx.issue1, id: String(params.issueId), statusId: String(body.statusId)}));
    }),
    http.get(`${API}/issues/:issueId/available-transitions`, () => json(fx.ok(fx.transitions))),

    // BoardController
    http.get(`${API}/projects/:projectId/boards`, () => json(fx.ok([fx.board]))),
    http.post(`${API}/projects/:projectId/boards`, async ({request}) => json(fx.ok({...fx.board, ...(await readBody(request))}))),
    http.get(`${API}/boards/:boardId`, () => json(fx.ok(fx.boardDetail()))),
    http.put(`${API}/boards/:boardId`, async ({request}) => json(fx.ok({...fx.board, ...(await readBody(request))}))),
    http.delete(`${API}/boards/:boardId`, () => json(fx.noContent())),
    http.post(`${API}/boards/:boardId/columns`, () => json(fx.ok(fx.boardDetail().columns[1]))),
    http.put(`${API}/boards/:boardId/columns/:columnId`, () => json(fx.ok(fx.boardDetail().columns[0]))),
    http.delete(`${API}/boards/:boardId/columns/:columnId`, () => json(fx.noContent())),
    http.put(`${API}/boards/:boardId/issues/:issueId/move`, async ({request}) => {
        const body = await readBody(request);
        if (!body.targetColumnId) return badRequest("targetColumnId: must not be blank");
        return json(fx.ok(fx.boardDetail()));
    }),

    // SprintController
    http.get(`${API}/projects/:projectId/sprints`, () => json(fx.ok([fx.sprint, fx.sprintPlanned]))),
    http.post(`${API}/projects/:projectId/sprints`, async ({request}) =>
        json(fx.ok({...fx.sprint, sprintStat: "Planned", ...(await readBody(request))}))),
    http.get(`${API}/sprints/:sprintId`, () => json(fx.ok(fx.sprint))),
    http.put(`${API}/sprints/:sprintId`, async ({request}) => json(fx.ok({...fx.sprint, ...(await readBody(request))}))),
    http.delete(`${API}/sprints/:sprintId`, () => json(fx.noContent())),
    http.post(`${API}/sprints/:sprintId/start`, () => json(fx.ok({...fx.sprint, sprintStat: "Active"}))),
    http.post(`${API}/sprints/:sprintId/complete`, () => json(fx.ok({...fx.sprint, sprintStat: "Completed"}))),
    http.post(`${API}/sprints/:sprintId/issues/:issueId`, () => json(fx.noContent())),
    http.delete(`${API}/sprints/:sprintId/issues/:issueId`, () => json(fx.noContent())),

    // CommentController — 수정·삭제는 /comments/{id} (이슈 경로 아님), 반응은 토글 POST 하나뿐
    http.get(`${API}/issues/:issueId/comments`, () => json(fx.ok([fx.comment]))),
    http.post(`${API}/issues/:issueId/comments`, async ({request}) => {
        const body = await readBody(request);
        if (!body.content) return badRequest("content: content is required");
        if (tooLong(body, "content")) return internalError();
        return json(fx.ok({
            ...fx.comment, id: "CMT-NEW", content: String(body.content),
            parentId: (body.parentId as string | undefined) ?? null, replies: [], reactions: [],
        }));
    }),
    http.put(`${API}/comments/:commentId`, async ({request}) => {
        const body = await readBody(request);
        return tooLong(body, "content") ? internalError() : json(fx.ok({...fx.comment, content: String(body.content)}));
    }),
    http.delete(`${API}/comments/:commentId`, () => json(fx.noContent())),
    http.post(`${API}/comments/:commentId/reactions`, async ({request}) => {
        const body = await readBody(request);
        if (!body.reactionType) return badRequest("reactionType: must not be blank");
        return json(fx.ok(fx.comment));
    }),

    // NotificationController — 페이지 없이 목록 전체, unread-count 는 {count}
    http.get(`${API}/notifications`, () => json(fx.ok(fx.notifications()))),
    http.get(`${API}/notifications/unread-count`, () =>
        json(fx.ok({count: fx.notifications().filter((n) => !n.read).length}))),
    http.put(`${API}/notifications/read-all`, () => json(fx.noContent())),
    http.put(`${API}/notifications/:id/read`, ({params}) =>
        json(fx.ok({...fx.notifications()[0], id: String(params.id), read: true}))),

    // UserController
    http.get(`${API}/users/search`, () => json(fx.ok(fx.userSearch))),

    // d94-query 에 없는 경로 → 500
    http.all(`${API}/*`, () => internalError()),
];
