// CIRA 작업 공간(Space) · 2단계 Feature — d94-query SpaceDto / IssueService.FeatureNode 와 필드명이 같다 (V650).
import type {IssueResponse} from "@/types/issue";

export interface Space {
    id: string;
    projectId: string;
    name: string;
    key: string;
    description: string | null;
    /** 만들 때 고른 프리셋(기준정보 작업 공간 프리셋). 참고용 — 이후 프리셋과 연결 없음 */
    presetTypeId: string | null;
    adminUserId: string;
    adminNm: string | null;
    isDefault: boolean;
    sortOrd: number;
    /** 현재 사용자가 프로젝트 ADMIN 이거나 이 공간 관리자 */
    canManage: boolean;
}

/** presetTypeId 없음 = 빈 공간(To Do → In Progress → Done). adminUserId 없음 = 만든 사람 */
export interface SaveSpace {
    name?: string;
    key?: string;
    description?: string;
    presetTypeId?: string | null;
    adminUserId?: string | null;
    sortOrd?: number;
}

export type FeatureScope = "COMMON" | "UNIT";

/** COMMON 이 항상 먼저. children = 그 공통 Feature 아래 단위 Feature */
export interface FeatureNode {
    feature: IssueResponse;
    taskCount: number;
    children: FeatureNode[];
}
