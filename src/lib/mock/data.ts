// TODO: 임시 - 백엔드 미기동 시 UI 검토용 Mock 데이터 (백엔드 복구 후 제거)
// 서버 메모리에만 저장되며, dev 서버 재시작 시 초기 상태로 돌아갑니다.

import type {IssueResponse, Priority, UserSummary} from "@/types/issue";
import type {ProjectResponse} from "@/types/project";
import type {SprintResponse} from "@/types/sprint";
import type {BoardResponse} from "@/types/board";
import type {CommentResponse} from "@/types/comment";
import type {ProjectMemberResponse} from "@/types/member";
import type {WorkflowStatusResponse, WorkflowTransitionResponse} from "@/types/workflow";
import type {VersionResponse} from "@/types/version";
import type {MilestoneResponse} from "@/types/milestone";
import type {AttachmentResponse} from "@/lib/api/attachments";
import type {AutomationRule, RuleExecution} from "@/lib/api/automation";
import type {GitActivityItem, GitRepoResponse} from "@/lib/api/git";
import type {NotificationItem} from "@/lib/api/notifications";
import type {SavedFilter} from "@/lib/api/search";
import type {WikiPageResponse, WikiVersionResponse} from "@/lib/api/wiki";
import type {InterfaceTestItemResponse} from "@/types/interfaceTest";

const DAY = 24 * 60 * 60 * 1000;

/** 오늘 기준 n일 전/후 ISO 문자열 */
export function daysFrom(n: number, hour = 10): string {
    const d = new Date(Date.now() + n * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
}

/** 오늘 기준 n일 전/후 YYYY-MM-DD */
export function dateFrom(n: number): string {
    return daysFrom(n).split("T")[0];
}

// ── 사용자 ───────────────────────────────────────────────────────────
export interface MockUser extends UserSummary {
    userId: string;
}

export const USERS: MockUser[] = [
    {userId: "u-admin", email: "admin", name: "Admin"},
    {userId: "u-1", email: "minjun.kim@cira.dev", name: "김민준"},
    {userId: "u-2", email: "seoyeon.lee@cira.dev", name: "이서연"},
    {userId: "u-3", email: "jiho.park@cira.dev", name: "박지호"},
    {userId: "u-4", email: "yuna.choi@cira.dev", name: "최유나"},
    {userId: "u-5", email: "hyunwoo.jung@cira.dev", name: "정현우"},
];

export const ME = USERS[0];

export function summary(u: MockUser): UserSummary {
    return {email: u.email, name: u.name};
}

export function findUser(idOrEmail?: string): MockUser | undefined {
    if (!idOrEmail) return undefined;
    return USERS.find((u) => u.userId === idOrEmail || u.email === idOrEmail);
}

// ── 이슈 유형 / 상태 ──────────────────────────────────────────────────
export const ISSUE_TYPES = [
    {id: "t-story", name: "Story"},
    {id: "t-task", name: "Task"},
    {id: "t-bug", name: "Bug"},
    {id: "t-epic", name: "Epic"},
];

function defaultStatuses(): WorkflowStatusResponse[] {
    return [
        {id: "s-todo", statusNm: "To Do", category: "TODO", colorCd: "#64748B", sortOrd: 1},
        {id: "s-progress", statusNm: "In Progress", category: "IN_PROGRESS", colorCd: "#2563EB", sortOrd: 2},
        {id: "s-review", statusNm: "In Review", category: "IN_PROGRESS", colorCd: "#7C3AED", sortOrd: 3},
        {id: "s-done", statusNm: "Done", category: "DONE", colorCd: "#16A34A", sortOrd: 4},
    ];
}

function defaultTransitions(): WorkflowTransitionResponse[] {
    return [
        {fromStatusId: "s-todo", toStatusId: "s-progress"},
        {fromStatusId: "s-progress", toStatusId: "s-todo"},
        {fromStatusId: "s-progress", toStatusId: "s-review"},
        {fromStatusId: "s-review", toStatusId: "s-progress"},
        {fromStatusId: "s-review", toStatusId: "s-done"},
        {fromStatusId: "s-done", toStatusId: "s-todo"},
    ];
}

// ── 시드 데이터 ───────────────────────────────────────────────────────
const ISSUE_SEED: Array<[string, string, Priority, number | undefined, number, string, string | undefined]> = [
    // [title, typeId, priority, storyPnt, assignee index, statusId, sprintId]
    ["로그인 화면 UI 개선", "t-story", "HIGH", 5, 1, "s-done", "sp-1"],
    ["JWT 토큰 만료 시 자동 로그아웃 처리", "t-task", "HIGHEST", 3, 3, "s-done", "sp-1"],
    ["프로젝트 목록 페이지네이션", "t-story", "MEDIUM", 3, 2, "s-done", "sp-1"],
    ["회원가입 이메일 중복 검사 오류", "t-bug", "HIGH", 2, 3, "s-done", "sp-1"],
    ["이슈 상세 화면 댓글 기능", "t-story", "HIGH", 8, 2, "s-done", "sp-2"],
    ["칸반 보드 드래그 앤 드롭", "t-story", "HIGHEST", 8, 1, "s-done", "sp-2"],
    ["첨부파일 업로드 진행률 표시", "t-task", "MEDIUM", 3, 4, "s-done", "sp-2"],
    ["보드 컬럼 WIP 제한 표시 오류", "t-bug", "LOW", 1, 5, "s-done", "sp-2"],
    ["스프린트 번다운 차트", "t-story", "HIGH", 5, 2, "s-done", "sp-3"],
    ["벨로시티 리포트 화면", "t-story", "MEDIUM", 5, 4, "s-review", "sp-3"],
    ["CFD(누적 흐름도) 리포트", "t-story", "MEDIUM", 5, 0, "s-progress", "sp-3"],
    ["이슈 목록 필터 조건 저장", "t-task", "MEDIUM", 3, 1, "s-progress", "sp-3"],
    ["알림 실시간 수신(SSE) 연동", "t-story", "HIGH", 8, 3, "s-progress", "sp-3"],
    ["위키 문서 버전 비교", "t-story", "LOW", 5, 5, "s-todo", "sp-3"],
    ["댓글 이모지 반응 카운트 오류", "t-bug", "HIGH", 2, 0, "s-todo", "sp-3"],
    ["대시보드 마감 임박 이슈 위젯", "t-task", "MEDIUM", 3, 2, "s-todo", "sp-3"],
    ["CQL 고급 검색 자동완성", "t-story", "HIGH", 8, 1, "s-todo", "sp-4"],
    ["Git 커밋 메시지 이슈 키 연동", "t-story", "MEDIUM", 5, 3, "s-todo", "sp-4"],
    ["자동화 규칙 실행 이력 화면", "t-task", "LOW", 3, 4, "s-todo", "sp-4"],
    ["릴리즈 노트 마크다운 내보내기", "t-task", "LOW", 2, 5, "s-todo", undefined],
    ["다크 모드 지원", "t-epic", "LOWEST", 13, 0, "s-todo", undefined],
    ["모바일 반응형 레이아웃 점검", "t-task", "MEDIUM", 5, 2, "s-todo", undefined],
    ["프로젝트 설정 권한 체크 누락", "t-bug", "HIGHEST", 2, 0, "s-todo", undefined],
    ["이슈 일괄 편집 기능", "t-story", "LOW", 8, -1, "s-todo", undefined],
];

const OPS_SEED: Array<[string, string, Priority, number, string]> = [
    ["운영 서버 디스크 사용량 알림 설정", "t-task", "HIGH", 2, "s-progress"],
    ["배포 파이프라인 캐시 적용", "t-task", "MEDIUM", 3, "s-todo"],
    ["DB 백업 스크립트 실패", "t-bug", "HIGHEST", 4, "s-review"],
    ["모니터링 대시보드 정리", "t-task", "LOW", 5, "s-done"],
    ["SSL 인증서 갱신", "t-task", "HIGH", 1, "s-todo"],
];

const CONTENT_SAMPLE =
    "<p>사용자가 기능을 원활하게 사용할 수 있도록 개선합니다.</p>" +
    "<h3>인수 조건</h3><ul><li>주요 브라우저(Chrome, Edge, Safari)에서 정상 동작</li>" +
    "<li>로딩 중에는 스켈레톤을 표시</li><li>에러 발생 시 Toast로 안내</li></ul>";

function buildStore() {
    const projects: ProjectResponse[] = [
        {
            id: "1",
            key: "CIRA",
            name: "CIRA",
            description: "이슈 트래킹 및 애자일 프로젝트 관리 서비스 CIRA 개발 프로젝트",
            projectType: "SCRUM",
            ownerId: ME.userId,
            issueSequence: ISSUE_SEED.length,
        },
        {
            id: "2",
            key: "OPS",
            name: "CIRA 운영",
            description: "인프라 및 운영 업무 칸반",
            projectType: "KANBAN",
            ownerId: "u-1",
            issueSequence: OPS_SEED.length,
        },
    ];

    const sprints: SprintResponse[] = [
        {
            id: "sp-1",
            projectId: "1",
            sprintNm: "CIRA Sprint 1",
            goal: "인증 및 프로젝트 기본 기능",
            status: "COMPLETED",
            startDt: dateFrom(-42),
            endDt: dateFrom(-29),
            createdAt: daysFrom(-45),
            modifiedAt: daysFrom(-29)
        },
        {
            id: "sp-2",
            projectId: "1",
            sprintNm: "CIRA Sprint 2",
            goal: "이슈 협업 기능",
            status: "COMPLETED",
            startDt: dateFrom(-28),
            endDt: dateFrom(-15),
            createdAt: daysFrom(-30),
            modifiedAt: daysFrom(-15)
        },
        {
            id: "sp-3",
            projectId: "1",
            sprintNm: "CIRA Sprint 3",
            goal: "리포트 및 알림 기능 완성",
            status: "ACTIVE",
            startDt: dateFrom(-7),
            endDt: dateFrom(7),
            createdAt: daysFrom(-16),
            modifiedAt: daysFrom(-7)
        },
        {
            id: "sp-4",
            projectId: "1",
            sprintNm: "CIRA Sprint 4",
            goal: "검색 및 연동 고도화",
            status: "CREATED",
            startDt: dateFrom(8),
            endDt: dateFrom(21),
            createdAt: daysFrom(-3),
            modifiedAt: daysFrom(-3)
        },
    ];

    const statuses: Record<string, WorkflowStatusResponse[]> = {"1": defaultStatuses(), "2": defaultStatuses()};
    const transitions: Record<string, WorkflowTransitionResponse[]> = {
        "1": defaultTransitions(),
        "2": defaultTransitions()
    };

    const issues: IssueResponse[] = [];
    const statusNm = (id: string) => defaultStatuses().find((s) => s.id === id)?.statusNm;
    const typeNm = (id: string) => ISSUE_TYPES.find((t) => t.id === id)?.name;

    ISSUE_SEED.forEach(([title, typeId, priority, pnt, ai, statusId, sprintId], i) => {
        const assignee = ai >= 0 ? USERS[ai] : undefined;
        issues.push({
            id: `i-${i + 1}`,
            issueKey: `CIRA-${i + 1}`,
            title,
            content: CONTENT_SAMPLE,
            issueTypeId: typeId,
            issueTypeNm: typeNm(typeId),
            statusId,
            statusNm: statusNm(statusId),
            priority,
            storyPnt: pnt,
            assignee: assignee ? summary(assignee) : undefined,
            reporter: summary(USERS[(i % 3) + 0]),
            projectId: "1",
            sprintId,
            dueDt: dateFrom(-30 + i * 3),
            createdAt: daysFrom(-50 + i * 2),
            modifiedAt: daysFrom(-20 + Math.floor(i * 0.8)),
        });
    });
    OPS_SEED.forEach(([title, typeId, priority, ai, statusId], i) => {
        issues.push({
            id: `o-${i + 1}`,
            issueKey: `OPS-${i + 1}`,
            title,
            content: CONTENT_SAMPLE,
            issueTypeId: typeId,
            issueTypeNm: typeNm(typeId),
            statusId,
            statusNm: statusNm(statusId),
            priority,
            assignee: summary(USERS[ai]),
            reporter: summary(USERS[1]),
            projectId: "2",
            dueDt: dateFrom(i * 2 - 2),
            createdAt: daysFrom(-20 + i),
            modifiedAt: daysFrom(-2 + Math.floor(i / 2)),
        });
    });

    const boards: BoardResponse[] = [
        {
            id: "b-1",
            projectId: "1",
            boardNm: "CIRA 스크럼 보드",
            boardType: "SCRUM",
            columnCount: 4,
            createdAt: daysFrom(-45),
            modifiedAt: daysFrom(-7)
        },
        {
            id: "b-2",
            projectId: "1",
            boardNm: "버그 트리아지",
            boardType: "KANBAN",
            columnCount: 4,
            createdAt: daysFrom(-20),
            modifiedAt: daysFrom(-10)
        },
        {
            id: "b-3",
            projectId: "2",
            boardNm: "운영 칸반",
            boardType: "KANBAN",
            columnCount: 4,
            createdAt: daysFrom(-20),
            modifiedAt: daysFrom(-2)
        },
    ];

    /** 보드 컬럼 (이슈 목록은 조회 시 statusId 기준으로 계산) */
    const boardColumns: Record<string, Array<{
        id: string;
        statusId: string;
        columnNm: string;
        wipLimit?: number;
        sortOrd: number
    }>> = {};
    for (const b of boards) {
        boardColumns[b.id] = defaultStatuses().map((s) => ({
            id: `${b.id}-c-${s.id}`,
            statusId: s.id,
            columnNm: s.statusNm,
            wipLimit: s.category === "IN_PROGRESS" ? 4 : undefined,
            sortOrd: s.sortOrd,
        }));
    }

    const comments: CommentResponse[] = [
        {
            id: "c-1",
            issueId: "i-11",
            content: "<p>차트 라이브러리는 Recharts 사용하는 걸로 확정했습니다.</p>",
            author: summary(USERS[2]),
            createdAt: daysFrom(-3, 9),
            modifiedAt: daysFrom(-3, 9),
            reactions: [{emoji: "👍", count: 3, reacted: true}, {emoji: "🎉", count: 1, reacted: false}],
            replies: [{
                id: "c-2",
                issueId: "i-11",
                content: "<p>좋습니다. 색상은 디자인 가이드 따를게요.</p>",
                author: summary(USERS[0]),
                createdAt: daysFrom(-3, 11),
                modifiedAt: daysFrom(-3, 11)
            }]
        },
        {
            id: "c-3",
            issueId: "i-11",
            content: "<p>날짜 범위 기본값은 최근 30일로 하면 될까요?</p>",
            author: summary(USERS[4]),
            createdAt: daysFrom(-1, 15),
            modifiedAt: daysFrom(-1, 15),
            reactions: []
        },
        {
            id: "c-4",
            issueId: "i-13",
            content: "<p>SSE 재연결 로직 PR 올렸습니다. 리뷰 부탁드려요.</p>",
            author: summary(USERS[3]),
            createdAt: daysFrom(-2, 14),
            modifiedAt: daysFrom(-2, 14),
            reactions: [{emoji: "👀", count: 2, reacted: false}]
        },
        {
            id: "c-5",
            issueId: "i-15",
            content: "<p>재현 경로: 같은 이모지를 빠르게 두 번 클릭하면 카운트가 2 증가합니다.</p>",
            author: summary(USERS[5]),
            createdAt: daysFrom(-1, 10),
            modifiedAt: daysFrom(-1, 10)
        },
    ];

    const attachments: AttachmentResponse[] = [
        {
            id: "a-1",
            issueId: "i-11",
            fileName: "cfd-wireframe.png",
            fileSize: 284_312,
            mimeType: "image/png",
            uploadedBy: USERS[2].name,
            uploadedAt: daysFrom(-4),
            downloadUrl: "/api/proxy/v1/attachments/a-1/download"
        },
        {
            id: "a-2",
            issueId: "i-11",
            fileName: "요구사항정의서_v1.2.pdf",
            fileSize: 1_843_200,
            mimeType: "application/pdf",
            uploadedBy: USERS[1].name,
            uploadedAt: daysFrom(-6),
            downloadUrl: "/api/proxy/v1/attachments/a-2/download"
        },
        {
            id: "a-3",
            issueId: "i-15",
            fileName: "error-log.txt",
            fileSize: 4_210,
            mimeType: "text/plain",
            uploadedBy: USERS[5].name,
            uploadedAt: daysFrom(-1),
            downloadUrl: "/api/proxy/v1/attachments/a-3/download"
        },
    ];

    const members: Record<string, ProjectMemberResponse[]> = {
        "1": USERS.map((u, i) => ({userId: u.userId, email: u.email, name: u.name, role: i < 2 ? "ADMIN" : "MEMBER"})),
        "2": [USERS[0], USERS[1], USERS[3]].map((u, i) => ({
            userId: u.userId,
            email: u.email,
            name: u.name,
            role: i < 2 ? "ADMIN" : "MEMBER"
        })),
    };

    const versions: VersionResponse[] = [
        {
            id: "v-1",
            projectId: "1",
            versionName: "v1.0.0",
            description: "최초 출시 - 인증, 프로젝트, 이슈 기본 기능",
            status: "RELEASED",
            plannedReleaseDate: dateFrom(-28),
            releasedAt: daysFrom(-27)
        },
        {
            id: "v-2",
            projectId: "1",
            versionName: "v1.1.0",
            description: "칸반 보드 및 댓글 기능",
            status: "RELEASED",
            plannedReleaseDate: dateFrom(-14),
            releasedAt: daysFrom(-14)
        },
        {
            id: "v-3",
            projectId: "1",
            versionName: "v1.2.0",
            description: "리포트 및 실시간 알림",
            status: "ACTIVE",
            plannedReleaseDate: dateFrom(8),
            releasedAt: null
        },
        {
            id: "v-4",
            projectId: "1",
            versionName: "v2.0.0",
            description: "고급 검색 및 외부 연동",
            status: "PLANNING",
            plannedReleaseDate: dateFrom(40),
            releasedAt: null
        },
        {
            id: "v-0",
            projectId: "1",
            versionName: "v0.9.0-beta",
            description: "사내 베타",
            status: "ARCHIVED",
            plannedReleaseDate: dateFrom(-60),
            releasedAt: daysFrom(-60)
        },
    ];

    const milestones: MilestoneResponse[] = [
        {id: "m-1", projectId: "1", name: "MVP 오픈", description: "사내 MVP 오픈", dueDate: dateFrom(-27), status: "CLOSED"},
        {
            id: "m-2",
            projectId: "1",
            name: "리포트 기능 완료",
            description: "번다운/벨로시티/CFD",
            dueDate: dateFrom(7),
            status: "OPEN"
        },
        {id: "m-3", projectId: "1", name: "정식 출시", description: null, dueDate: dateFrom(45), status: "OPEN"},
    ];

    const wikiPages: Array<WikiPageResponse & { projectId: string; sortOrder: number }> = [
        {
            id: "w-1",
            projectId: "1",
            title: "CIRA 개요",
            parentId: null,
            sortOrder: 1,
            version: 3,
            createdBy: USERS[1].name,
            createdAt: daysFrom(-40),
            updatedAt: daysFrom(-5),
            content: "<h2>CIRA란?</h2><p>CIRA는 팀의 이슈와 스프린트를 관리하는 애자일 프로젝트 관리 도구입니다.</p><ul><li>이슈 트래킹</li><li>스크럼/칸반 보드</li><li>리포트</li></ul>",
            contentHtml: ""
        },
        {
            id: "w-2",
            projectId: "1",
            title: "개발 가이드",
            parentId: null,
            sortOrder: 2,
            version: 2,
            createdBy: USERS[3].name,
            createdAt: daysFrom(-35),
            updatedAt: daysFrom(-10),
            content: "<h2>개발 가이드</h2><p>프론트엔드는 Next.js App Router, 백엔드는 Spring Boot를 사용합니다.</p>",
            contentHtml: ""
        },
        {
            id: "w-3",
            projectId: "1",
            title: "코딩 컨벤션",
            parentId: "w-2",
            sortOrder: 1,
            version: 1,
            createdBy: USERS[3].name,
            createdAt: daysFrom(-30),
            updatedAt: daysFrom(-30),
            content: "<h3>네이밍</h3><ul><li>컴포넌트: PascalCase</li><li>훅: use + PascalCase</li></ul><h3>스타일</h3><p>Tailwind 유틸리티 클래스를 우선 사용합니다.</p>",
            contentHtml: ""
        },
        {
            id: "w-4",
            projectId: "1",
            title: "브랜치 전략",
            parentId: "w-2",
            sortOrder: 2,
            version: 1,
            createdBy: USERS[2].name,
            createdAt: daysFrom(-28),
            updatedAt: daysFrom(-28),
            content: "<p><code>main</code> ← <code>develop</code> ← <code>feature/CIRA-123</code> 구조를 사용합니다.</p>",
            contentHtml: ""
        },
        {
            id: "w-5",
            projectId: "1",
            title: "회의록",
            parentId: null,
            sortOrder: 3,
            version: 1,
            createdBy: USERS[0].name,
            createdAt: daysFrom(-7),
            updatedAt: daysFrom(-1),
            content: "<h2>Sprint 3 플래닝</h2><p>목표: 리포트 및 알림 기능 완성</p><ol><li>번다운 차트</li><li>CFD</li><li>SSE 알림</li></ol>",
            contentHtml: ""
        },
    ];
    wikiPages.forEach((p) => (p.contentHtml = p.content));

    const wikiVersions: Record<string, WikiVersionResponse[]> = {
        "w-1": [
            {version: 1, content: "<h2>CIRA란?</h2><p>초안</p>", createdBy: USERS[1].name, createdAt: daysFrom(-40)},
            {
                version: 2,
                content: "<h2>CIRA란?</h2><p>CIRA는 이슈 관리 도구입니다.</p>",
                createdBy: USERS[2].name,
                createdAt: daysFrom(-20)
            },
            {version: 3, content: wikiPages[0].content, createdBy: USERS[1].name, createdAt: daysFrom(-5)},
        ],
    };

    const automationRules: Array<AutomationRule & { projectId: string }> = [
        {
            id: "r-1",
            projectId: "1",
            ruleName: "이슈 담당자 지정 시 알림",
            triggerType: "ISSUE_ASSIGNED",
            conditions: {},
            actionType: "SEND_NOTIFICATION",
            actionParams: {target: "assignee"},
            isActive: true,
            createdAt: daysFrom(-30)
        },
        {
            id: "r-2",
            projectId: "1",
            ruleName: "PR 머지 시 Done으로 이동",
            triggerType: "ISSUE_STATUS_CHANGED",
            conditions: {fromStatus: "In Review"},
            actionType: "CHANGE_STATUS",
            actionParams: {statusId: "s-done"},
            isActive: true,
            createdAt: daysFrom(-20)
        },
        {
            id: "r-3",
            projectId: "1",
            ruleName: "긴급 버그 Slack 웹훅",
            triggerType: "ISSUE_CREATED",
            conditions: {priority: "HIGHEST", issueType: "Bug"},
            actionType: "SEND_WEBHOOK",
            actionParams: {url: "https://hooks.example.com/cira"},
            isActive: false,
            createdAt: daysFrom(-10)
        },
    ];

    const ruleExecutions: RuleExecution[] = [
        {id: "re-1", ruleId: "r-1", status: "SUCCESS", triggeredAt: daysFrom(-1, 9), detail: "CIRA-13 → 박지호에게 알림 발송"},
        {id: "re-2", ruleId: "r-1", status: "SUCCESS", triggeredAt: daysFrom(-2, 16), detail: "CIRA-12 → 김민준에게 알림 발송"},
        {id: "re-3", ruleId: "r-2", status: "SKIPPED", triggeredAt: daysFrom(-1, 13), detail: "조건 불일치"},
        {id: "re-4", ruleId: "r-2", status: "FAILURE", triggeredAt: daysFrom(-3, 11), detail: "전환 규칙 없음: To Do → Done"},
    ];

    const gitRepos: Array<GitRepoResponse & { projectId: string }> = [
        {
            id: "g-1",
            projectId: "1",
            repoName: "cira-web",
            repoUrl: "https://github.com/example/cira-web",
            provider: "GITHUB",
            webhookUrl: "https://cira.dev/webhooks/git/g-1",
            webhookSecret: "whsec_mock_xxxxxxxx",
            createdAt: daysFrom(-40)
        },
        {
            id: "g-2",
            projectId: "1",
            repoName: "cira-api",
            repoUrl: "https://gitlab.com/example/cira-api",
            provider: "GITLAB",
            webhookUrl: "https://cira.dev/webhooks/git/g-2",
            webhookSecret: "whsec_mock_yyyyyyyy",
            createdAt: daysFrom(-38)
        },
    ];

    const gitActivity: GitActivityItem[] = [
        {
            id: "ga-1",
            type: "PR",
            author: USERS[3].name,
            message: "CIRA-13 SSE 알림 재연결 처리",
            url: "https://github.com/example/cira-web/pull/42",
            createdAt: daysFrom(-1, 17)
        },
        {
            id: "ga-2",
            type: "COMMIT",
            author: USERS[2].name,
            message: "CIRA-9 번다운 차트 툴팁 추가",
            url: "https://github.com/example/cira-web/commit/a1b2c3d",
            createdAt: daysFrom(-2, 11)
        },
        {
            id: "ga-3",
            type: "COMMIT",
            author: USERS[4].name,
            message: "CIRA-10 벨로시티 API 연동",
            createdAt: daysFrom(-2, 15)
        },
        {
            id: "ga-4",
            type: "PR",
            author: USERS[1].name,
            message: "CIRA-12 필터 저장 기능",
            url: "https://github.com/example/cira-web/pull/40",
            createdAt: daysFrom(-4, 10)
        },
    ];

    const notifications: NotificationItem[] = [
        {
            id: "n-1",
            type: "ISSUE_ASSIGNED",
            title: "이슈가 할당되었습니다",
            body: "CIRA-15 댓글 이모지 반응 카운트 오류",
            isRead: false,
            issueId: "i-15",
            issueKey: "CIRA-15",
            createdAt: daysFrom(0, 9)
        },
        {
            id: "n-2",
            type: "MENTION",
            title: "이서연님이 회원님을 멘션했습니다",
            body: "CIRA-11: 날짜 범위 기본값 확인 부탁드립니다.",
            isRead: false,
            issueId: "i-11",
            issueKey: "CIRA-11",
            createdAt: daysFrom(-1, 15)
        },
        {
            id: "n-3",
            type: "ISSUE_COMMENTED",
            title: "새 댓글",
            body: "박지호: SSE 재연결 로직 PR 올렸습니다.",
            isRead: false,
            issueId: "i-13",
            issueKey: "CIRA-13",
            createdAt: daysFrom(-2, 14)
        },
        {
            id: "n-4",
            type: "ISSUE_STATUS_CHANGED",
            title: "상태 변경",
            body: "CIRA-9 In Review → Done",
            isRead: true,
            issueId: "i-9",
            issueKey: "CIRA-9",
            createdAt: daysFrom(-3, 18)
        },
        {
            id: "n-5",
            type: "ISSUE_STATUS_CHANGED",
            title: "상태 변경",
            body: "CIRA-10 In Progress → In Review",
            isRead: true,
            issueId: "i-10",
            issueKey: "CIRA-10",
            createdAt: daysFrom(-4, 10)
        },
    ];

    const savedFilters: SavedFilter[] = [
        {
            id: "f-1",
            name: "내 미완료 이슈",
            params: {q: "", assigneeId: [ME.email], status: ["s-todo", "s-progress"]},
            createdAt: daysFrom(-10)
        },
        {id: "f-2", name: "긴급 버그", params: {q: "버그", priority: ["HIGHEST", "HIGH"]}, createdAt: daysFrom(-5)},
    ];

    return {
        projects, sprints, statuses, transitions, issues, boards, boardColumns, comments, attachments,
        members, versions, milestones, wikiPages, wikiVersions, automationRules, ruleExecutions,
        gitRepos, gitActivity, notifications, savedFilters,
        interfaceTests: [] as InterfaceTestItemResponse[],
        seq: 1000,
    };
}

export type MockStore = ReturnType<typeof buildStore>;

// dev 서버 HMR 시에도 데이터가 유지되도록 globalThis 에 보관
const g = globalThis as unknown as { __ciraMockStore?: MockStore };

export function getStore(): MockStore {
    if (!g.__ciraMockStore) g.__ciraMockStore = buildStore();
    return g.__ciraMockStore;
}

export function nextId(prefix: string): string {
    const s = getStore();
    s.seq += 1;
    return `${prefix}-${s.seq}`;
}
