import {Columns3, Settings, SquareKanban, type LucideIcon} from "lucide-react";

// 현재 경로 → 사이드바가 펼칠 프로젝트·설정 메뉴 여부
export function getNavContext(pathname: string): { projectId?: string; inSettings: boolean } {
    const m = pathname.match(/^\/cira\/projects\/([^/]+)(\/[^/]+)?/);
    if (!m) return {inSettings: false};
    return {projectId: decodeURIComponent(m[1]), inSettings: m[2] === "/settings"};
}

export const SIDEBAR_COOKIE = "cira_sidebar_collapsed";

/** 사이드바 팀(작업 공간) 아래 메뉴. href = base + suffix + ?space=<팀> */
export function teamLinks(canManage: boolean): { suffix: string; label: string; icon: LucideIcon }[] {
    return [
        {suffix: "/boards", label: "보드", icon: SquareKanban},
        {suffix: "/issues", label: "Task", icon: Columns3},
        ...(canManage ? [{suffix: "/settings/space", label: "공간 설정", icon: Settings}] : []),
    ];
}

/** 팀 메뉴 활성: 경로가 맞고 지금 공간이 그 팀. `?space=` 없는 Task 목록은 통합(Task (전체))이라 팀 Task 가 아니다 */
export function teamActive(pathname: string, base: string, suffix: string, teamId: string,
                           currentSpaceId: string | undefined, isAll: boolean): boolean {
    const href = base + suffix;
    const onPath = pathname === href || pathname.startsWith(href + "/");
    return onPath && currentSpaceId === teamId && !(suffix === "/issues" && isAll);
}

/** 지금 그 팀 화면(보드·Task·공간 설정)에 있나 — 팀을 저절로 펼치고 접힘 배지를 강조하는 기준 */
export function onTeamRoute(pathname: string, base: string, teamId: string,
                            currentSpaceId: string | undefined, isAll: boolean): boolean {
    return teamLinks(true).some((l) => teamActive(pathname, base, l.suffix, teamId, currentSpaceId, isAll));
}
