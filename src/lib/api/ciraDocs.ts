import apiClient from "./client";
import type {DeriveFromIssueRequest, DocRule, IssueDocs, IssueType} from "@/types/ciraDocs";
import type {Note} from "@/types/docs";
import type {IssueResponse} from "@/types/issue";

const p = (projectId: string) => `/v1/projects/${projectId}`;

export async function getIssueTypes(): Promise<IssueType[]> {
    const res = await apiClient.get("/v1/issue-types");
    return res.data.data;
}

export async function getDocRules(projectId: string): Promise<DocRule[]> {
    const res = await apiClient.get(`${p(projectId)}/doc-rules`);
    return res.data.data;
}

/** 그 Task 타입의 슬롯 목록을 통째로 저장 (프로젝트 ADMIN) */
export async function saveDocRules(projectId: string, issueTypeId: string, rules: DocRule[]): Promise<DocRule[]> {
    const res = await apiClient.put(`${p(projectId)}/doc-rules/${issueTypeId}`, rules);
    return res.data.data;
}

export async function getIssueDocs(projectId: string, issueId: string): Promise<IssueDocs> {
    const res = await apiClient.get(`${p(projectId)}/issues/${issueId}/docs`);
    return res.data.data;
}

/** 메인 노트가 없는 Task 에 메인 노트 생성·연결 */
export async function ensureIssueMainDoc(projectId: string, issueId: string): Promise<IssueDocs> {
    const res = await apiClient.post(`${p(projectId)}/issues/${issueId}/docs`);
    return res.data.data;
}

export async function deriveIssueDoc(projectId: string, issueId: string, req: DeriveFromIssueRequest): Promise<Note> {
    const res = await apiClient.post(`${p(projectId)}/issues/${issueId}/docs/derive`, req);
    return res.data.data;
}

/** Team vault 노트면 그 노트 자체가 Task 의 메인 문서(설명)가 된다. spaceId 없음 = 기본 공간 */
export async function promoteNoteToCira(projectId: string, noteId: string, issueTypeId?: string, title?: string,
                                        spaceId?: string): Promise<IssueResponse> {
    const res = await apiClient.post(`${p(projectId)}/docs/notes/${noteId}/promote-to-cira`, {issueTypeId, title, spaceId});
    return res.data.data;
}
