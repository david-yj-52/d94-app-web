// 현재 경로 → 사이드바가 펼칠 프로젝트·설정 메뉴 여부
export function getNavContext(pathname: string): { projectId?: string; inSettings: boolean } {
    const m = pathname.match(/^\/cira\/projects\/([^/]+)(\/[^/]+)?/);
    if (!m) return {inSettings: false};
    return {projectId: decodeURIComponent(m[1]), inSettings: m[2] === "/settings"};
}

export const SIDEBAR_COOKIE = "cira_sidebar_collapsed";
