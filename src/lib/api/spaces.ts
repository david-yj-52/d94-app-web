import apiClient from "./client";
import type {DocRule} from "@/types/ciraDocs";
import type {FeatureNode, SaveSpace, Space} from "@/types/space";

// 작업 공간 (V630). 공간별 설정(워크플로·필드·보드·컬럼)은 기존 함수에 spaceId 를 넘긴다 (= /projects/{id}/...?spaceId=)

export async function getSpaces(projectId: string): Promise<Space[]> {
    return (await apiClient.get(`/v1/projects/${projectId}/spaces`)).data.data;
}

/** 프로젝트 ADMIN */
export async function createSpace(projectId: string, data: SaveSpace): Promise<Space> {
    return (await apiClient.post(`/v1/projects/${projectId}/spaces`, data)).data.data;
}

/** 이름·설명 = 프로젝트 ADMIN 또는 공간 관리자, adminUserId(관리자 임명) = 프로젝트 ADMIN */
export async function updateSpace(spaceId: string, data: SaveSpace): Promise<Space> {
    return (await apiClient.put(`/v1/spaces/${spaceId}`, data)).data.data;
}

/** 기본 공간·Task 가 남은 공간은 409 */
export async function deleteSpace(spaceId: string): Promise<void> {
    await apiClient.delete(`/v1/spaces/${spaceId}`);
}

/** 2단계 Feature 트리 (COMMON 먼저). spaceId 를 주면 UNIT 은 그 공간 것만 */
export async function getFeatures(projectId: string, spaceId?: string | null): Promise<FeatureNode[]> {
    return (await apiClient.get(`/v1/projects/${projectId}/features`, {params: spaceId ? {spaceId} : {}})).data.data;
}

// ── 산출물 규칙 3단계 ──

export async function getGlobalDocRules(): Promise<DocRule[]> {
    return (await apiClient.get("/v1/cira/doc-rules")).data.data;
}

/** 총괄 ADMIN — 그 Task 타입의 전사 규칙을 통째로 저장 */
export async function saveGlobalDocRules(issueTypeId: string, rules: DocRule[]): Promise<DocRule[]> {
    return (await apiClient.put(`/v1/cira/doc-rules/${issueTypeId}`, rules)).data.data;
}

/** 기준정보 → 프로젝트 공통 잠금 복사 (프로젝트 ADMIN). ruleIds 없으면 전부 */
export async function importDocRules(projectId: string, ruleIds?: string[]): Promise<DocRule[]> {
    return (await apiClient.post(`/v1/projects/${projectId}/doc-rules/import`, {ruleIds: ruleIds ?? []})).data.data;
}

/** 공간 규칙 + 그 공간에 적용되는 프로젝트 공통 규칙(scope PROJECT, locked 포함) */
export async function getSpaceDocRules(spaceId: string): Promise<DocRule[]> {
    return (await apiClient.get(`/v1/spaces/${spaceId}/doc-rules`)).data.data;
}

export async function saveSpaceDocRules(spaceId: string, issueTypeId: string, rules: DocRule[]): Promise<DocRule[]> {
    return (await apiClient.put(`/v1/spaces/${spaceId}/doc-rules/${issueTypeId}`, rules)).data.data;
}
