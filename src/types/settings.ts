/** 기준정보 설정 (d94-query /api/v1/settings). 키 → 값 */
export type SettingMap = Record<string, string>;

export const LOGO_TEXT_KEY = "general.logo.text";
export const LOGO_FONT_KEY = "general.logo.font";
export const DEFAULT_LOGO_TEXT = "TSHInc";
export const CIRA_PROJECT_TYPES_KEY = "cira.project.types";
export const DEFAULT_CIRA_PROJECT_TYPES = ["SCRUM", "KANBAN"];

/** cira.project.types 설정값을 문자열 배열로 파싱한다 */
export function parseCiraProjectTypes(raw?: string): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    } catch {
        return [];
    }
}

/** GET /v1/users/me (lib-core UserResponse). roles 는 ROLE_ 접두사 없음 */
export interface Me {
    email: string;
    name: string;
    avatarUrl?: string | null;
    roles: string[];
}

/** 기준정보 화면 왼쪽 그룹. link 가 있으면 기존 설정 화면으로 보내는 링크만 보인다 */
export interface SettingGroup {
    id: string;
    label: string;
    description: string;
    icon: import("lucide-react").LucideIcon;
    link?: string;
}
