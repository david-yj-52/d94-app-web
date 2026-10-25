// TODO: 임시 - 백엔드 미기동 시 /api/proxy 요청을 Mock 데이터로 응답 (백엔드 복구 후 제거)

import type {IssueResponse, PageResponse, Priority} from "@/types/issue";
import type {BoardDetailResponse} from "@/types/board";
import type {CommentResponse} from "@/types/comment";
import type {SprintResponse} from "@/types/sprint";
import type {CfdResponse, DashboardIssue, DashboardResponse} from "@/types/reports";
import type {InterfaceTestItemResponse} from "@/types/interfaceTest";
import {dateFrom, findUser, getStore, ISSUE_TYPES, ME, nextId, summary, USERS} from "./data";

type Params = Record<string, string>;
type Body = Record<string, unknown>;

interface Ctx {
    params: Params;
    query: URLSearchParams;
    body: Body;
}

export interface MockResult {
    status: number;
    body?: unknown;
    /** JSON 이외 응답 (첨부파일 다운로드 등) */
    raw?: Response;
}

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const notFound = (what: string): MockResult => ({
    status: 404,
    body: {success: false, error: `${what} not found (mock)`}
});

// ── 공통 유틸 ─────────────────────────────────────────────────────────
function paginate<T>(items: T[], query: URLSearchParams, defaultSize = 20): PageResponse<T> {
    const page = Number(query.get("page") ?? 0);
    const size = Number(query.get("size") ?? defaultSize);
    return {
        content: items.slice(page * size, page * size + size),
        totalElements: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / size)),
        number: page,
        size,
    };
}

/** axios 배열 직렬화(status[]=a&status[]=b) 및 반복 키(status=a&status=b) 모두 지원 */
function multi(query: URLSearchParams, key: string): string[] {
    return [...query.getAll(key), ...query.getAll(`${key}[]`)].flatMap((v) => v.split(",")).filter(Boolean);
}

function statusOf(projectId: string, statusId?: string) {
    return getStore().statuses[projectId]?.find((s) => s.id === statusId);
}

function applyIssuePatch(issue: IssueResponse, body: Body) {
    if (typeof body.title === "string") issue.title = body.title;
    if (typeof body.content === "string") issue.content = body.content;
    if (typeof body.priority === "string") issue.priority = body.priority as Priority;
    if (body.storyPnt !== undefined) issue.storyPnt = body.storyPnt === null ? undefined : Number(body.storyPnt);
    if (body.dueDt !== undefined) issue.dueDt = (body.dueDt as string) || undefined;
    if (body.sprintId !== undefined) issue.sprintId = (body.sprintId as string) || undefined;
    if (typeof body.issueTypeId === "string") {
        issue.issueTypeId = body.issueTypeId;
        issue.issueTypeNm = ISSUE_TYPES.find((t) => t.id === body.issueTypeId)?.name;
    }
    if (typeof body.statusId === "string") {
        const st = statusOf(issue.projectId, body.statusId);
        if (st) {
            issue.statusId = st.id;
            issue.statusNm = st.statusNm;
        }
    }
    if (body.assigneeId !== undefined) {
        const u = findUser(body.assigneeId as string);
        issue.assignee = u ? summary(u) : undefined;
    }
    issue.modifiedAt = new Date().toISOString();
}

function filterIssues(items: IssueResponse[], query: URLSearchParams): IssueResponse[] {
    const keyword = (query.get("keyword") ?? query.get("q") ?? "").trim().toLowerCase();
    const statuses = multi(query, "status");
    const priorities = multi(query, "priority");
    const assignees = multi(query, "assigneeId");
    const issueType = query.get("issueType");
    const sprintId = query.get("sprintId");
    const projectIds = multi(query, "projectIds");

    return items.filter((i) => {
        if (keyword && !`${i.issueKey} ${i.title}`.toLowerCase().includes(keyword)) return false;
        if (statuses.length && !statuses.includes(i.statusId ?? "") && !statuses.includes(i.statusNm ?? "")) return false;
        if (priorities.length && !priorities.includes(i.priority ?? "")) return false;
        if (assignees.length) {
            const u = findUser(i.assignee?.email);
            if (!assignees.includes(i.assignee?.email ?? "") && !assignees.includes(u?.userId ?? "")) return false;
        }
        if (issueType && i.issueTypeId !== issueType && i.issueTypeNm !== issueType) return false;
        if (sprintId && i.sprintId !== sprintId) return false;
        if (projectIds.length && !projectIds.includes(i.projectId)) return false;
        return true;
    });
}

function sortNewest(items: IssueResponse[]) {
    return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function boardDetail(boardId: string): BoardDetailResponse | undefined {
    const s = getStore();
    const board = s.boards.find((b) => b.id === boardId);
    if (!board) return undefined;
    const activeSprint = s.sprints.find((sp) => sp.projectId === board.projectId && sp.status === "ACTIVE");
    const project = s.projects.find((p) => p.id === board.projectId);
    // 스크럼 보드는 활성 스프린트 이슈만, 칸반은 전체
    let pool = s.issues.filter((i) => i.projectId === board.projectId);
    if (project?.projectType === "SCRUM" && board.boardType === "SCRUM" && activeSprint) {
        pool = pool.filter((i) => i.sprintId === activeSprint.id);
    }
    if (board.boardNm.includes("버그")) pool = pool.filter((i) => i.issueTypeNm === "Bug");

    const columns = (s.boardColumns[boardId] ?? []).map((c) => {
        const st = statusOf(board.projectId, c.statusId);
        return {
            id: c.id,
            boardId,
            statusId: c.statusId,
            statusNm: st?.statusNm,
            statusCategory: st?.category,
            colorCd: st?.colorCd,
            columnNm: c.columnNm,
            wipLimit: c.wipLimit,
            sortOrd: c.sortOrd,
            issues: pool
                .filter((i) => i.statusId === c.statusId)
                .map((i) => ({
                    id: i.id,
                    issueKey: i.issueKey,
                    title: i.title,
                    priority: i.priority,
                    issueTypeId: i.issueTypeId,
                    issueTypeNm: i.issueTypeNm,
                    statusId: i.statusId,
                    statusNm: i.statusNm,
                    assignee: i.assignee,
                })),
        };
    });
    return {
        id: board.id,
        projectId: board.projectId,
        boardNm: board.boardNm,
        boardType: board.boardType,
        columns,
        createdAt: board.createdAt,
        modifiedAt: board.modifiedAt
    };
}

function sprintWithCount(sp: SprintResponse): SprintResponse {
    return {...sp, issueCount: getStore().issues.filter((i) => i.sprintId === sp.id).length};
}

function findComment(list: CommentResponse[], id: string): CommentResponse | undefined {
    for (const c of list) {
        if (c.id === id) return c;
        const r = findComment(c.replies ?? [], id);
        if (r) return r;
    }
    return undefined;
}

function toDashboardIssue(i: IssueResponse): DashboardIssue {
    const project = getStore().projects.find((p) => p.id === i.projectId);
    return {
        id: i.id, issueKey: i.issueKey, title: i.title, status: i.statusId ?? "", statusNm: i.statusNm,
        priority: i.priority ?? "MEDIUM", dueDate: i.dueDt, projectName: project?.name, assignee: i.assignee,
    };
}

function sprintPoints(sprintId: string) {
    const items = getStore().issues.filter((i) => i.sprintId === sprintId);
    const total = items.reduce((a, i) => a + (i.storyPnt ?? 0), 0);
    const done = items.filter((i) => statusOf(i.projectId, i.statusId)?.category === "DONE").reduce((a, i) => a + (i.storyPnt ?? 0), 0);
    return {total, done};
}

// ── 라우트 정의 ───────────────────────────────────────────────────────
type Handler = (ctx: Ctx) => MockResult;
const routes: Array<[string, string, Handler]> = [];
const on = (method: string, pattern: string, h: Handler) => routes.push([method, pattern, h]);

// 인증
on("POST", "/v1/auth/register", () => ok({id: nextId("u")}));
on("POST", "/v1/auth/login", () => ok({
    accessToken: "dev-admin-token",
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {name: ME.name}
}));

// 사용자 / 대시보드
on("GET", "/v1/users/search", ({query}) => {
    const k = (query.get("keyword") ?? "").toLowerCase();
    return ok(USERS.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(k)).map(summary));
});
on("GET", "/v1/users/me/dashboard", () => {
    const s = getStore();
    const mine = s.issues.filter((i) => i.assignee?.email === ME.email && statusOf(i.projectId, i.statusId)?.category !== "DONE");
    const open = s.issues.filter((i) => statusOf(i.projectId, i.statusId)?.category !== "DONE" && i.dueDt);
    const upcoming = open.filter((i) => i.dueDt! >= dateFrom(0) && i.dueDt! <= dateFrom(14)).sort((a, b) => a.dueDt!.localeCompare(b.dueDt!));
    const active = s.sprints.find((sp) => sp.status === "ACTIVE");
    const sprintIssues = s.issues.filter((i) => i.sprintId === active?.id);
    const data: DashboardResponse = {
        assignedIssues: mine.map(toDashboardIssue),
        upcomingDeadlines: upcoming.slice(0, 6).map(toDashboardIssue),
        recentActivity: s.notifications.map((n) => ({
            id: n.id,
            type: n.type,
            description: n.body,
            createdAt: n.createdAt,
            issueKey: n.issueKey,
            issueTitle: s.issues.find((i) => i.id === n.issueId)?.title
        })),
        sprintProgress: {
            sprintName: active?.sprintNm,
            totalIssues: sprintIssues.length,
            completedIssues: sprintIssues.filter((i) => statusOf(i.projectId, i.statusId)?.category === "DONE").length,
            inProgressIssues: sprintIssues.filter((i) => statusOf(i.projectId, i.statusId)?.category === "IN_PROGRESS").length,
        },
    };
    return ok(data);
});

// 프로젝트
on("GET", "/v1/projects", () => ok(getStore().projects));
on("POST", "/v1/projects", ({body}) => {
    const s = getStore();
    const p = {
        id: nextId("p"),
        key: String(body.key),
        name: String(body.name),
        description: String(body.description ?? ""),
        projectType: (body.projectType as "SCRUM" | "KANBAN") ?? "SCRUM",
        ownerId: ME.userId,
        issueSequence: 0
    };
    s.projects.push(p);
    s.statuses[p.id] = structuredClone(s.statuses["1"]);
    s.transitions[p.id] = structuredClone(s.transitions["1"]);
    s.members[p.id] = [{userId: ME.userId, email: ME.email, name: ME.name, role: "ADMIN"}];
    return ok(p);
});
on("GET", "/v1/projects/:projectId", ({params}) => {
    const p = getStore().projects.find((x) => x.id === params.projectId || x.key === params.projectId);
    return p ? ok(p) : notFound("project");
});
on("PUT", "/v1/projects/:projectId", ({params, body}) => {
    const p = getStore().projects.find((x) => x.id === params.projectId);
    if (!p) return notFound("project");
    Object.assign(p, {
        name: body.name ?? p.name,
        description: body.description ?? p.description,
        projectType: body.projectType ?? p.projectType
    });
    return ok(p);
});

// 이슈
on("GET", "/v1/projects/:projectId/issues", ({params, query}) => {
    const items = filterIssues(getStore().issues.filter((i) => i.projectId === params.projectId), query);
    return ok(paginate(sortNewest(items), query));
});
on("POST", "/v1/projects/:projectId/issues", ({params, body}) => {
    const s = getStore();
    const p = s.projects.find((x) => x.id === params.projectId);
    if (!p) return notFound("project");
    p.issueSequence += 1;
    const first = s.statuses[p.id][0];
    const now = new Date().toISOString();
    const issue: IssueResponse = {
        id: nextId("i"), issueKey: `${p.key}-${p.issueSequence}`, title: String(body.title ?? "새 이슈"),
        statusId: first.id, statusNm: first.statusNm, priority: "MEDIUM", reporter: summary(ME),
        projectId: p.id, createdAt: now, modifiedAt: now,
    };
    applyIssuePatch(issue, body);
    s.issues.push(issue);
    return ok(issue);
});
on("GET", "/v1/issues/:issueId", ({params}) => {
    const i = getStore().issues.find((x) => x.id === params.issueId || x.issueKey === params.issueId);
    return i ? ok(i) : notFound("issue");
});
on("PUT", "/v1/issues/:issueId", ({params, body}) => {
    const i = getStore().issues.find((x) => x.id === params.issueId);
    if (!i) return notFound("issue");
    applyIssuePatch(i, body);
    return ok(i);
});
on("DELETE", "/v1/issues/:issueId", ({params}) => {
    const s = getStore();
    s.issues = s.issues.filter((x) => x.id !== params.issueId);
    return ok(null);
});
on("PUT", "/v1/issues/:issueId/status", ({params, body}) => {
    const i = getStore().issues.find((x) => x.id === params.issueId);
    if (!i) return notFound("issue");
    applyIssuePatch(i, {statusId: body.statusId});
    return ok(i);
});
on("GET", "/v1/issues/:issueId/available-transitions", ({params}) => {
    const s = getStore();
    const i = s.issues.find((x) => x.id === params.issueId);
    if (!i) return notFound("issue");
    const targets = s.transitions[i.projectId].filter((t) => t.fromStatusId === i.statusId).map((t) => t.toStatusId);
    return ok(s.statuses[i.projectId].filter((st) => targets.includes(st.id)));
});

// 댓글 / 반응
on("GET", "/v1/issues/:issueId/comments", ({params}) => ok(getStore().comments.filter((c) => c.issueId === params.issueId)));
on("POST", "/v1/issues/:issueId/comments", ({params, body}) => {
    const s = getStore();
    const now = new Date().toISOString();
    const c: CommentResponse = {
        id: nextId("c"),
        issueId: params.issueId,
        content: String(body.content ?? ""),
        author: summary(ME),
        createdAt: now,
        modifiedAt: now,
        replies: [],
        reactions: []
    };
    const parent = body.parentCommentId ? findComment(s.comments, String(body.parentCommentId)) : undefined;
    if (parent) (parent.replies ??= []).push(c);
    else s.comments.push(c);
    return ok(c);
});
on("PUT", "/v1/issues/:issueId/comments/:commentId", ({params, body}) => {
    const c = findComment(getStore().comments, params.commentId);
    if (!c) return notFound("comment");
    c.content = String(body.content ?? c.content);
    c.modifiedAt = new Date().toISOString();
    return ok(c);
});
on("DELETE", "/v1/issues/:issueId/comments/:commentId", ({params}) => {
    const s = getStore();
    const strip = (list: CommentResponse[]): CommentResponse[] =>
        list.filter((c) => c.id !== params.commentId).map((c) => ({...c, replies: strip(c.replies ?? [])}));
    s.comments = strip(s.comments);
    return ok(null);
});
on("POST", "/v1/comments/:commentId/reactions", ({params, body}) => {
    const c = findComment(getStore().comments, params.commentId);
    if (!c) return notFound("comment");
    const emoji = String(body.emoji);
    const r = (c.reactions ??= []).find((x) => x.emoji === emoji);
    if (r) {
        if (!r.reacted) {
            r.count += 1;
            r.reacted = true;
        }
    } else c.reactions.push({emoji, count: 1, reacted: true});
    return ok(null);
});
on("DELETE", "/v1/comments/:commentId/reactions/:emoji", ({params}) => {
    const c = findComment(getStore().comments, params.commentId);
    if (!c) return notFound("comment");
    const r = c.reactions?.find((x) => x.emoji === params.emoji);
    if (r?.reacted) {
        r.count -= 1;
        r.reacted = false;
    }
    c.reactions = c.reactions?.filter((x) => x.count > 0);
    return ok(null);
});

// 첨부파일
on("GET", "/v1/issues/:issueId/attachments", ({params}) => ok(getStore().attachments.filter((a) => a.issueId === params.issueId)));
on("DELETE", "/v1/attachments/:id", ({params}) => {
    const s = getStore();
    s.attachments = s.attachments.filter((a) => a.id !== params.id);
    return ok(null);
});
on("GET", "/v1/attachments/:id/download", ({params}) => {
    const a = getStore().attachments.find((x) => x.id === params.id);
    if (!a) return notFound("attachment");
    return {
        status: 200,
        raw: new Response(`Mock file: ${a.fileName}\n(백엔드 미기동 상태의 샘플 파일입니다)`, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(a.fileName)}.txt`
            },
        }),
    };
});

// 보드
on("GET", "/v1/projects/:projectId/boards", ({params}) => ok(getStore().boards.filter((b) => b.projectId === params.projectId)));
on("POST", "/v1/projects/:projectId/boards", ({params, body}) => {
    const s = getStore();
    const now = new Date().toISOString();
    const b = {
        id: nextId("b"),
        projectId: params.projectId,
        boardNm: String(body.boardNm),
        boardType: String(body.boardType ?? "KANBAN"),
        columnCount: 0,
        createdAt: now,
        modifiedAt: now
    };
    s.boards.push(b);
    s.boardColumns[b.id] = (s.statuses[params.projectId] ?? []).map((st) => ({
        id: nextId("col"),
        statusId: st.id,
        columnNm: st.statusNm,
        sortOrd: st.sortOrd
    }));
    b.columnCount = s.boardColumns[b.id].length;
    return ok(b);
});
on("GET", "/v1/boards/:boardId", ({params}) => {
    const d = boardDetail(params.boardId);
    return d ? ok(d) : notFound("board");
});
on("PUT", "/v1/boards/:boardId", ({params, body}) => {
    const b = getStore().boards.find((x) => x.id === params.boardId);
    if (!b) return notFound("board");
    if (body.boardNm) b.boardNm = String(body.boardNm);
    return ok(b);
});
on("DELETE", "/v1/boards/:boardId", ({params}) => {
    const s = getStore();
    s.boards = s.boards.filter((b) => b.id !== params.boardId);
    return ok(null);
});
on("POST", "/v1/boards/:boardId/columns", ({params, body}) => {
    const s = getStore();
    const cols = (s.boardColumns[params.boardId] ??= []);
    const col = {
        id: nextId("col"),
        statusId: String(body.statusId),
        columnNm: String(body.columnNm),
        wipLimit: body.wipLimit as number | undefined,
        sortOrd: cols.length + 1
    };
    cols.push(col);
    return ok(boardDetail(params.boardId)?.columns.find((c) => c.id === col.id));
});
on("PUT", "/v1/boards/:boardId/columns/:columnId", ({params, body}) => {
    const col = getStore().boardColumns[params.boardId]?.find((c) => c.id === params.columnId);
    if (!col) return notFound("column");
    if (body.columnNm) col.columnNm = String(body.columnNm);
    if (body.wipLimit !== undefined) col.wipLimit = body.wipLimit as number;
    return ok(boardDetail(params.boardId)?.columns.find((c) => c.id === col.id));
});
on("DELETE", "/v1/boards/:boardId/columns/:columnId", ({params}) => {
    const s = getStore();
    s.boardColumns[params.boardId] = (s.boardColumns[params.boardId] ?? []).filter((c) => c.id !== params.columnId);
    return ok(null);
});
on("PUT", "/v1/boards/:boardId/issues/:issueId/move", ({params, body}) => {
    const s = getStore();
    const col = s.boardColumns[params.boardId]?.find((c) => c.id === body.targetColumnId);
    const issue = s.issues.find((i) => i.id === params.issueId);
    if (!col || !issue) return notFound("column/issue");
    applyIssuePatch(issue, {statusId: col.statusId});
    return ok(boardDetail(params.boardId));
});

// 스프린트
on("GET", "/v1/projects/:projectId/sprints", ({params}) => ok(getStore().sprints.filter((sp) => sp.projectId === params.projectId).map(sprintWithCount)));
on("POST", "/v1/projects/:projectId/sprints", ({params, body}) => {
    const now = new Date().toISOString();
    const sp: SprintResponse = {
        id: nextId("sp"),
        projectId: params.projectId,
        sprintNm: String(body.sprintNm),
        goal: body.goal as string | undefined,
        status: "CREATED",
        startDt: body.startDt as string | undefined,
        endDt: body.endDt as string | undefined,
        createdAt: now,
        modifiedAt: now
    };
    getStore().sprints.push(sp);
    return ok(sprintWithCount(sp));
});
on("GET", "/v1/sprints/:sprintId", ({params}) => {
    const sp = getStore().sprints.find((x) => x.id === params.sprintId);
    return sp ? ok(sprintWithCount(sp)) : notFound("sprint");
});
on("PUT", "/v1/sprints/:sprintId", ({params, body}) => {
    const sp = getStore().sprints.find((x) => x.id === params.sprintId);
    if (!sp) return notFound("sprint");
    Object.assign(sp, body, {modifiedAt: new Date().toISOString()});
    return ok(sprintWithCount(sp));
});
on("DELETE", "/v1/sprints/:sprintId", ({params}) => {
    const s = getStore();
    s.sprints = s.sprints.filter((x) => x.id !== params.sprintId);
    s.issues.forEach((i) => i.sprintId === params.sprintId && (i.sprintId = undefined));
    return ok(null);
});
on("POST", "/v1/sprints/:sprintId/start", ({params}) => {
    const sp = getStore().sprints.find((x) => x.id === params.sprintId);
    if (!sp) return notFound("sprint");
    sp.status = "ACTIVE";
    sp.startDt ??= dateFrom(0);
    sp.endDt ??= dateFrom(14);
    return ok(sprintWithCount(sp));
});
on("POST", "/v1/sprints/:sprintId/complete", ({params, body}) => {
    const s = getStore();
    const sp = s.sprints.find((x) => x.id === params.sprintId);
    if (!sp) return notFound("sprint");
    sp.status = "COMPLETED";
    const target = body.incompleteIssueAction === "NEXT_SPRINT" ? (body.nextSprintId as string) : undefined;
    s.issues
        .filter((i) => i.sprintId === sp.id && statusOf(i.projectId, i.statusId)?.category !== "DONE")
        .forEach((i) => (i.sprintId = target));
    return ok(sprintWithCount(sp));
});
on("POST", "/v1/sprints/:sprintId/issues/:issueId", ({params}) => {
    const i = getStore().issues.find((x) => x.id === params.issueId);
    if (i) i.sprintId = params.sprintId;
    return ok(null);
});
on("DELETE", "/v1/sprints/:sprintId/issues/:issueId", ({params}) => {
    const i = getStore().issues.find((x) => x.id === params.issueId);
    if (i) i.sprintId = undefined;
    return ok(null);
});

// 리포트
on("GET", "/v1/sprints/:sprintId/burndown", ({params}) => {
    const sp = getStore().sprints.find((x) => x.id === params.sprintId);
    if (!sp?.startDt || !sp.endDt) return notFound("sprint");
    const {total, done} = sprintPoints(sp.id);
    const start = new Date(sp.startDt).getTime();
    const days = Math.round((new Date(sp.endDt).getTime() - start) / 86_400_000);
    const elapsed = sp.status === "COMPLETED" ? days : Math.min(days, Math.max(0, Math.round((Date.now() - start) / 86_400_000)));
    const day = (n: number) => new Date(start + n * 86_400_000).toISOString().split("T")[0];
    const ideal = Array.from({length: days + 1}, (_, n) => ({
        date: day(n),
        remainingPoints: Math.round((total * (days - n)) / days * 10) / 10
    }));
    // 실제 소진: 경과일 동안 완료 포인트를 계단식으로 분배
    const actual = Array.from({length: elapsed + 1}, (_, n) => {
        const burned = elapsed === 0 ? 0 : Math.round(done * Math.pow(n / elapsed, 1.3));
        return {date: day(n), remainingPoints: total - burned};
    });
    return ok({
        sprintName: sp.sprintNm,
        startDate: sp.startDt,
        endDate: sp.endDt,
        totalPoints: total,
        idealBurndown: ideal,
        actualBurndown: actual
    });
});
on("GET", "/v1/projects/:projectId/velocity", ({params, query}) => {
    const lastN = Number(query.get("lastN") ?? 6);
    const history = [
        {sprintName: "Pilot Sprint A", committed: 18, completed: 14},
        {sprintName: "Pilot Sprint B", committed: 20, completed: 19},
    ];
    const real = getStore().sprints
        .filter((sp) => sp.projectId === params.projectId && sp.status !== "CREATED")
        .map((sp) => {
            const {total, done} = sprintPoints(sp.id);
            return {sprintName: sp.sprintNm, committed: total, completed: done};
        });
    return ok([...history, ...real].slice(-lastN).map((v) => ({...v, velocity: v.completed})));
});
on("GET", "/v1/projects/:projectId/cfd", ({params, query}) => {
    const s = getStore();
    const statuses = (s.statuses[params.projectId] ?? []).map((st) => st.statusNm);
    const start = new Date(query.get("startDate") ?? dateFrom(-30)).getTime();
    const end = new Date(query.get("endDate") ?? dateFrom(0)).getTime();
    const n = Math.max(1, Math.round((end - start) / 86_400_000));
    const dates = Array.from({length: n + 1}, (_, k) => new Date(start + k * 86_400_000).toISOString().split("T")[0]);
    const total = s.issues.filter((i) => i.projectId === params.projectId).length;
    const data: CfdResponse["data"] = {};
    statuses.forEach((st) => (data[st] = []));
    dates.forEach((_, k) => {
        const t = k / n;
        const created = Math.round(total * (0.55 + 0.45 * t));
        const doneN = Math.round(created * 0.45 * t);
        const review = Math.round(created * 0.1);
        const prog = Math.round(created * (0.15 + 0.05 * Math.sin(k / 3)));
        const vals = [Math.max(0, created - doneN - review - prog), prog, review, doneN];
        statuses.forEach((st, idx) => data[st].push(vals[idx] ?? 0));
    });
    return ok({dates, statuses, data} satisfies CfdResponse);
});

// 프로젝트 설정 - 멤버
on("GET", "/v1/projects/:projectId/members", ({params}) => ok(getStore().members[params.projectId] ?? []));
on("POST", "/v1/projects/:projectId/members", ({params, body}) => {
    const s = getStore();
    const u = findUser(String(body.email));
    const email = String(body.email);
    const m = {
        userId: u?.userId ?? nextId("u"),
        email,
        name: u?.name ?? email.split("@")[0],
        role: (body.role as "ADMIN" | "MEMBER") ?? "MEMBER"
    };
    (s.members[params.projectId] ??= []).push(m);
    return ok(m);
});
on("PUT", "/v1/projects/:projectId/members/:userId", ({params, body}) => {
    const m = getStore().members[params.projectId]?.find((x) => x.userId === params.userId);
    if (!m) return notFound("member");
    m.role = body.role as "ADMIN" | "MEMBER";
    return ok(m);
});
on("DELETE", "/v1/projects/:projectId/members/:userId", ({params}) => {
    const s = getStore();
    s.members[params.projectId] = (s.members[params.projectId] ?? []).filter((m) => m.userId !== params.userId);
    return ok(null);
});

// 프로젝트 설정 - 워크플로우
on("GET", "/v1/projects/:projectId/workflow/statuses", ({params}) => ok(getStore().statuses[params.projectId] ?? []));
on("POST", "/v1/projects/:projectId/workflow/statuses", ({params, body}) => {
    const list = (getStore().statuses[params.projectId] ??= []);
    const st = {
        id: nextId("s"),
        statusNm: String(body.statusNm),
        category: body.category as "TODO" | "IN_PROGRESS" | "DONE",
        colorCd: body.colorCd as string | undefined,
        sortOrd: Number(body.sortOrd ?? list.length + 1)
    };
    list.push(st);
    return ok(st);
});
on("DELETE", "/v1/projects/:projectId/workflow/statuses/:statusId", ({params}) => {
    const s = getStore();
    s.statuses[params.projectId] = (s.statuses[params.projectId] ?? []).filter((st) => st.id !== params.statusId);
    return ok(null);
});
on("GET", "/v1/projects/:projectId/workflow/transitions", ({params}) => ok(getStore().transitions[params.projectId] ?? []));
on("PUT", "/v1/projects/:projectId/workflow/transitions", ({params, body}) => {
    getStore().transitions[params.projectId] = (body.transitions as never[]) ?? [];
    return ok(getStore().transitions[params.projectId]);
});

// 자동화
on("GET", "/v1/projects/:projectId/automation-rules", ({params}) => ok(getStore().automationRules.filter((r) => r.projectId === params.projectId)));
on("POST", "/v1/projects/:projectId/automation-rules", ({params, body}) => {
    const r = {
        ...(body as never as Record<string, never>),
        id: nextId("r"),
        projectId: params.projectId,
        createdAt: new Date().toISOString()
    };
    getStore().automationRules.push(r as never);
    return ok(r);
});
on("PUT", "/v1/automation-rules/:ruleId", ({params, body}) => {
    const r = getStore().automationRules.find((x) => x.id === params.ruleId);
    if (!r) return notFound("rule");
    Object.assign(r, body);
    return ok(r);
});
on("DELETE", "/v1/automation-rules/:ruleId", ({params}) => {
    const s = getStore();
    s.automationRules = s.automationRules.filter((r) => r.id !== params.ruleId);
    return ok(null);
});
on("GET", "/v1/automation-rules/:ruleId/executions", ({params}) => ok(getStore().ruleExecutions.filter((e) => e.ruleId === params.ruleId)));

// Git 연동
on("GET", "/v1/projects/:projectId/git-repos", ({params}) => ok(getStore().gitRepos.filter((g) => g.projectId === params.projectId)));
on("POST", "/v1/projects/:projectId/git-repos", ({params, body}) => {
    const id = nextId("g");
    const g = {
        id,
        projectId: params.projectId,
        repoName: String(body.repoName),
        repoUrl: String(body.repoUrl),
        provider: body.provider as "GITHUB",
        webhookUrl: `https://cira.dev/webhooks/git/${id}`,
        webhookSecret: "whsec_mock_new",
        createdAt: new Date().toISOString()
    };
    getStore().gitRepos.push(g);
    return ok(g);
});
on("DELETE", "/v1/git-repos/:repoId", ({params}) => {
    const s = getStore();
    s.gitRepos = s.gitRepos.filter((g) => g.id !== params.repoId);
    return ok(null);
});
on("GET", "/v1/projects/:projectId/git-activity", ({params}) => ok(params.projectId === "1" ? getStore().gitActivity : []));

// 버전
on("GET", "/v1/projects/:projectId/versions", ({params}) => ok(getStore().versions.filter((v) => v.projectId === params.projectId)));
on("POST", "/v1/projects/:projectId/versions", ({params, body}) => {
    const v = {
        id: nextId("v"),
        projectId: params.projectId,
        versionName: String(body.versionName),
        description: (body.description as string) ?? null,
        status: "PLANNING" as const,
        plannedReleaseDate: (body.plannedReleaseDate as string) ?? null,
        releasedAt: null
    };
    getStore().versions.push(v);
    return ok(v);
});
on("GET", "/v1/versions/:versionId", ({params}) => {
    const v = getStore().versions.find((x) => x.id === params.versionId);
    return v ? ok(v) : notFound("version");
});
on("PUT", "/v1/versions/:versionId", ({params, body}) => {
    const v = getStore().versions.find((x) => x.id === params.versionId);
    if (!v) return notFound("version");
    Object.assign(v, body);
    return ok(v);
});
on("DELETE", "/v1/versions/:versionId", ({params}) => {
    const s = getStore();
    s.versions = s.versions.filter((v) => v.id !== params.versionId);
    return ok(null);
});
on("POST", "/v1/versions/:versionId/release", ({params}) => {
    const v = getStore().versions.find((x) => x.id === params.versionId);
    if (!v) return notFound("version");
    v.status = "RELEASED";
    v.releasedAt = new Date().toISOString();
    return ok(v);
});
on("POST", "/v1/versions/:versionId/archive", ({params}) => {
    const v = getStore().versions.find((x) => x.id === params.versionId);
    if (!v) return notFound("version");
    v.status = "ARCHIVED";
    return ok(v);
});
on("GET", "/v1/versions/:versionId/release-notes", ({params}) => {
    const s = getStore();
    const v = s.versions.find((x) => x.id === params.versionId);
    if (!v) return notFound("version");
    // 버전별로 완료 이슈를 나눠서 보여줌 (mock)
    const sprintMap: Record<string, string> = {"v-1": "sp-1", "v-2": "sp-2", "v-3": "sp-3", "v-4": "sp-4"};
    const items = s.issues.filter((i) => i.sprintId === sprintMap[v.id]);
    const group = (cat: string, type: string) => ({
        category: cat,
        issues: items.filter((i) => i.issueTypeNm === type).map((i) => ({
            id: i.id,
            issueKey: i.issueKey,
            title: i.title,
            issueTypeNm: i.issueTypeNm ?? ""
        }))
    });
    return ok({
        versionName: v.versionName,
        groups: [group("✨ 새 기능", "Story"), group("🐛 버그 수정", "Bug"), group("🔧 개선 작업", "Task")].filter((g) => g.issues.length)
    });
});

// 마일스톤
on("GET", "/v1/projects/:projectId/milestones", ({params}) => ok(getStore().milestones.filter((m) => m.projectId === params.projectId)));
on("POST", "/v1/projects/:projectId/milestones", ({params, body}) => {
    const m = {
        id: nextId("m"),
        projectId: params.projectId,
        name: String(body.name),
        description: (body.description as string) ?? null,
        dueDate: (body.dueDate as string) ?? null,
        status: (body.status as "OPEN") ?? "OPEN"
    };
    getStore().milestones.push(m);
    return ok(m);
});
on("GET", "/v1/milestones/:id", ({params}) => {
    const m = getStore().milestones.find((x) => x.id === params.id);
    return m ? ok(m) : notFound("milestone");
});
on("PUT", "/v1/milestones/:id", ({params, body}) => {
    const m = getStore().milestones.find((x) => x.id === params.id);
    if (!m) return notFound("milestone");
    Object.assign(m, body);
    return ok(m);
});
on("DELETE", "/v1/milestones/:id", ({params}) => {
    const s = getStore();
    s.milestones = s.milestones.filter((m) => m.id !== params.id);
    return ok(null);
});
on("GET", "/v1/milestones/:id/progress", ({params}) => {
    const progress: Record<string, [number, number]> = {"m-1": [8, 8], "m-2": [8, 3]};
    const [total, completed] = progress[params.id] ?? [12, 0];
    return ok({milestoneId: params.id, total, completed, percentage: Math.round((completed / total) * 100)});
});

// 위키
on("GET", "/v1/projects/:projectId/wiki", ({params}) => {
    const pages = getStore().wikiPages.filter((p) => p.projectId === params.projectId);
    return ok(pages.map((p) => ({
        id: p.id,
        title: p.title,
        parentId: p.parentId,
        sortOrder: p.sortOrder,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        childCount: pages.filter((c) => c.parentId === p.id).length
    })));
});
on("POST", "/v1/projects/:projectId/wiki", ({params, body}) => {
    const s = getStore();
    const now = new Date().toISOString();
    const content = String(body.content ?? "");
    const siblings = s.wikiPages.filter((p) => p.projectId === params.projectId && p.parentId === ((body.parentId as string) ?? null));
    const p = {
        id: nextId("w"),
        projectId: params.projectId,
        title: String(body.title),
        content,
        contentHtml: content,
        parentId: (body.parentId as string) ?? null,
        sortOrder: siblings.length + 1,
        version: 1,
        createdBy: ME.name,
        createdAt: now,
        updatedAt: now
    };
    s.wikiPages.push(p);
    s.wikiVersions[p.id] = [{version: 1, content, createdBy: ME.name, createdAt: now}];
    return ok(p);
});
on("GET", "/v1/wiki/:pageId", ({params}) => {
    const p = getStore().wikiPages.find((x) => x.id === params.pageId);
    return p ? ok(p) : notFound("wiki page");
});
on("PUT", "/v1/wiki/:pageId", ({params, body}) => {
    const s = getStore();
    const p = s.wikiPages.find((x) => x.id === params.pageId);
    if (!p) return notFound("wiki page");
    p.title = String(body.title ?? p.title);
    p.content = p.contentHtml = String(body.content ?? p.content);
    p.version += 1;
    p.updatedAt = new Date().toISOString();
    (s.wikiVersions[p.id] ??= []).push({
        version: p.version,
        content: p.content,
        createdBy: ME.name,
        createdAt: p.updatedAt
    });
    return ok(p);
});
on("DELETE", "/v1/wiki/:pageId", ({params}) => {
    const s = getStore();
    s.wikiPages = s.wikiPages.filter((p) => p.id !== params.pageId && p.parentId !== params.pageId);
    return ok(null);
});
on("PUT", "/v1/wiki/:pageId/move", ({params, body}) => {
    const p = getStore().wikiPages.find((x) => x.id === params.pageId);
    if (!p) return notFound("wiki page");
    p.parentId = (body.parentId as string) ?? null;
    if (body.sortOrder !== undefined) p.sortOrder = Number(body.sortOrder);
    return ok(p);
});
on("GET", "/v1/wiki/:pageId/versions", ({params}) => {
    const s = getStore();
    const p = s.wikiPages.find((x) => x.id === params.pageId);
    return ok(s.wikiVersions[params.pageId] ?? (p ? [{
        version: p.version,
        content: p.content,
        createdBy: p.createdBy,
        createdAt: p.updatedAt
    }] : []));
});

// 알림
on("GET", "/v1/notifications", ({query}) => ok(paginate([...getStore().notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), query)));
on("GET", "/v1/notifications/unread-count", () => ok(getStore().notifications.filter((n) => !n.isRead).length));
on("PUT", "/v1/notifications/read-all", () => {
    getStore().notifications.forEach((n) => (n.isRead = true));
    return ok(null);
});
on("PUT", "/v1/notifications/:id/read", ({params}) => {
    const n = getStore().notifications.find((x) => x.id === params.id);
    if (n) n.isRead = true;
    return ok(null);
});

// 검색
on("GET", "/v1/search/issues", ({query}) => {
    let items = filterIssues(getStore().issues, query);
    const sort = query.get("sort");
    if (sort === "updated") items = [...items].sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
    else items = sortNewest(items);
    return ok(paginate(items, query));
});
on("POST", "/v1/search/cql", ({body}) => {
    const cql = String(body.cql ?? "");
    let items = getStore().issues;
    // 아주 단순한 CQL 해석: project / status / priority / assignee / type / text 조건만 지원
    const cond = (key: string) => {
        const m = cql.match(new RegExp(`\\b${key}\\s*=\\s*(?:"([^"]*)"|([^\\s)]+))`, "i"));
        return m ? (m[1] ?? m[2]) : undefined;
    };
    const project = cond("project");
    const status = cond("status");
    const priority = cond("priority");
    const type = cond("type");
    const assignee = cond("assignee");
    const text = cql.match(/text\s*~\s*"([^"]+)"/i)?.[1];
    if (project) items = items.filter((i) => getStore().projects.find((p) => p.id === i.projectId)?.key.toLowerCase() === project.toLowerCase());
    if (status) items = items.filter((i) => i.statusNm?.toLowerCase() === status.toLowerCase());
    if (priority) items = items.filter((i) => i.priority?.toLowerCase() === priority.toLowerCase());
    if (type) items = items.filter((i) => i.issueTypeNm?.toLowerCase() === type.toLowerCase());
    if (assignee) items = items.filter((i) => assignee === "currentUser()" ? i.assignee?.email === ME.email : i.assignee?.name === assignee || i.assignee?.email === assignee);
    if (text) items = items.filter((i) => i.title.includes(text));
    const page = Number(body.page ?? 0);
    const size = Number(body.size ?? 20);
    return ok(paginate(sortNewest(items), new URLSearchParams({page: String(page), size: String(size)})));
});
on("POST", "/v1/search/cql/validate", ({body}) => {
    const cql = String(body.cql ?? "");
    const quotes = (cql.match(/"/g) ?? []).length;
    if (quotes % 2 === 1) return ok({valid: false, error: "닫히지 않은 따옴표가 있습니다.", position: cql.lastIndexOf('"')});
    if (/\b(AND|OR)\s*$/i.test(cql.trim())) return ok({valid: false, error: "조건식이 완성되지 않았습니다.", position: cql.length});
    return ok({valid: true});
});
on("GET", "/v1/search/cql/autocomplete", ({query}) => {
    const cql = query.get("cql") ?? "";
    const cursor = Number(query.get("cursor") ?? cql.length);
    const lastToken = cql.slice(0, cursor).split(/\s+/).pop()?.toLowerCase() ?? "";
    const fields = ["project", "status", "priority", "assignee", "type", "sprint", "created", "updated", "text", "AND", "OR", "ORDER BY"];
    const values: Record<string, string[]> = {
        status: ['"To Do"', '"In Progress"', '"In Review"', '"Done"'],
        priority: ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"],
        type: ['"Story"', '"Task"', '"Bug"', '"Epic"'],
        project: ["CIRA", "OPS"],
        assignee: ["currentUser()", ...USERS.map((u) => `"${u.name}"`)],
    };
    const prevField = cql.slice(0, cursor).match(/(\w+)\s*=\s*\S*$/)?.[1]?.toLowerCase();
    const suggestions = prevField && values[prevField] ? values[prevField] : fields.filter((f) => f.toLowerCase().startsWith(lastToken));
    return ok({suggestions});
});
on("GET", "/v1/saved-filters", () => ok(getStore().savedFilters));
on("POST", "/v1/saved-filters", ({body}) => {
    const f = {
        id: nextId("f"),
        name: String(body.name),
        params: body.params as never,
        createdAt: new Date().toISOString()
    };
    getStore().savedFilters.push(f);
    return ok(f);
});
on("DELETE", "/v1/saved-filters/:id", ({params}) => {
    const s = getStore();
    s.savedFilters = s.savedFilters.filter((f) => f.id !== params.id);
    return ok(null);
});

// 인터페이스 테스트 — 백엔드와 같은 상태코드(201 / 204 / 400 / 404)로 응답
const badRequest = (message: string): MockResult => ({status: 400, body: {success: false, code: "BAD_REQUEST", message}});
const findIfItem = (id: string) => getStore().interfaceTests.find((x) => x.id === id);
const hasName = (body: Body) => typeof body.name === "string" && body.name.trim() !== "";
const touch = (item: InterfaceTestItemResponse, event: string) => {
    item.lastEvent = event;
    item.modifiedAt = new Date().toISOString();
};

on("GET", "/v1/interface-tests", () => ok(getStore().interfaceTests));
on("GET", "/v1/interface-tests/:id", ({params}) => {
    const item = findIfItem(params.id);
    return item ? ok(item) : notFound("interface test item");
});
on("HEAD", "/v1/interface-tests/:id", ({params}) => ({status: findIfItem(params.id) ? 200 : 404}));
on("POST", "/v1/interface-tests", ({body}) => {
    if (!hasName(body)) return badRequest("name 은 필수입니다.");
    const now = new Date().toISOString();
    const item: InterfaceTestItemResponse = {
        id: nextId("ift"),
        name: String(body.name),
        content: (body.content as string) ?? null,
        status: (body.status as string) ?? "NEW",
        lastEvent: "CreateIfTestItem",
        createdAt: now,
        modifiedAt: now,
    };
    getStore().interfaceTests.unshift(item);
    return {status: 201, body: {success: true, code: "201", data: item}};
});
on("PUT", "/v1/interface-tests/:id", ({params, body}) => {
    const item = findIfItem(params.id);
    if (!item) return notFound("interface test item");
    if (!hasName(body)) return badRequest("name 은 필수입니다.");
    item.name = String(body.name);
    item.content = (body.content as string) ?? null;
    item.status = (body.status as string) ?? "NEW";
    touch(item, "ReplaceIfTestItem");
    return ok(item);
});
on("PATCH", "/v1/interface-tests/:id", ({params, body}) => {
    const item = findIfItem(params.id);
    if (!item) return notFound("interface test item");
    if (typeof body.name === "string") {
        if (!hasName(body)) return badRequest("name 은 비울 수 없습니다.");
        item.name = body.name;
    }
    if (typeof body.content === "string") item.content = body.content;
    if (typeof body.status === "string") item.status = body.status;
    touch(item, "PatchIfTestItem");
    return ok(item);
});
on("DELETE", "/v1/interface-tests/:id", ({params}) => {
    const s = getStore();
    if (!findIfItem(params.id)) return notFound("interface test item");
    s.interfaceTests = s.interfaceTests.filter((x) => x.id !== params.id);
    return {status: 204};
});

// ── 디스패처 ─────────────────────────────────────────────────────────
function match(pattern: string, path: string): Params | null {
    const p = pattern.split("/").filter(Boolean);
    const a = path.split("/").filter(Boolean);
    if (p.length !== a.length) return null;
    const params: Params = {};
    for (let i = 0; i < p.length; i++) {
        if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(a[i]);
        else if (p[i] !== a[i]) return null;
    }
    return params;
}

export async function handleMockRequest(request: Request, path: string[]): Promise<MockResult> {
    const url = new URL(request.url);
    // "/api/v1/..." 로 호출하는 경우도 허용
    const segments = path[0] === "api" ? path.slice(1) : path;
    const pathname = `/${segments.join("/")}`;
    const method = request.method.toUpperCase();

    let body: Body = {};
    if (method !== "GET" && method !== "HEAD") {
        const ct = request.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) body = (await request.json().catch(() => ({}))) as Body;
        else if (ct.includes("multipart/form-data")) {
            // 첨부파일 업로드
            const form = await request.formData();
            const file = form.get("file");
            const issueId = match("/v1/issues/:issueId/attachments", pathname)?.issueId;
            if (file instanceof File && issueId) {
                const id = nextId("a");
                const a = {
                    id,
                    issueId,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || "application/octet-stream",
                    uploadedBy: ME.name,
                    uploadedAt: new Date().toISOString(),
                    downloadUrl: `/api/proxy/v1/attachments/${id}/download`
                };
                getStore().attachments.push(a);
                return ok(a);
            }
        }
    }

    for (const [m, pattern, handler] of routes) {
        if (m !== method) continue;
        const params = match(pattern, pathname);
        if (params) return handler({params, query: url.searchParams, body});
    }
    console.warn(`[mock] 미구현 API: ${method} ${pathname}`);
    return {status: 404, body: {success: false, error: `Mock route not implemented: ${method} ${pathname}`}};
}

export const isMockEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_MOCK_API === "true";