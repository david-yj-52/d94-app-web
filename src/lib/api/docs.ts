import apiClient from "./client";
import type {
    DeriveRequest,
    DocsFolder,
    DocsVault,
    DocsTask,
    GraphData,
    LineageNode,
    Note,
    NoteFilters,
    NoteKind,
    NoteRequest,
    NoteSummary,
    NoteVersion,
    TaskFilters,
    TaskStatus,
    VaultScope,
    DocsKnowledgeHit,
    DocsKnowledgeResult,
} from "@/types/docs";

const BASE = "/v1/docs";

// ── vault ──
export async function getDocsVaults(): Promise<DocsVault[]> {
    const res = await apiClient.get(`${BASE}/vaults`);
    return res.data.data;
}

// ── 폴더 ──
export async function getDocsFolders(vaultId: VaultScope = "ALL"): Promise<DocsFolder[]> {
    const res = await apiClient.get(`${BASE}/folders`, {params: {vaultId}});
    return res.data.data;
}

/** parentId 가 없으면 vaultId 의 최상위 (생략 = 내 Private) */
export async function createDocsFolder(name: string, parentId: string | null, vaultId?: string): Promise<DocsFolder> {
    const res = await apiClient.post(`${BASE}/folders`, {name, parentId, vaultId});
    return res.data.data;
}

export async function renameDocsFolder(id: string, name: string): Promise<DocsFolder> {
    const res = await apiClient.put(`${BASE}/folders/${id}`, {name});
    return res.data.data;
}

export async function moveDocsFolder(id: string, parentId: string | null): Promise<DocsFolder> {
    const res = await apiClient.put(`${BASE}/folders/${id}/move`, {parentId});
    return res.data.data;
}

export async function deleteDocsFolder(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/folders/${id}`);
}

// ── 노트 ──
export async function getNotes(filters: NoteFilters = {}): Promise<NoteSummary[]> {
    const res = await apiClient.get(`${BASE}/notes`, {params: filters});
    return res.data.data;
}

export async function getNoteTitles(prefix: string): Promise<string[]> {
    const res = await apiClient.get(`${BASE}/notes/titles`, {params: {prefix}});
    return res.data.data;
}

export async function getNoteByTitle(title: string): Promise<Note> {
    const res = await apiClient.get(`${BASE}/notes/by-title`, {params: {title}});
    return res.data.data;
}

export async function getNote(id: string): Promise<Note> {
    const res = await apiClient.get(`${BASE}/notes/${id}`);
    return res.data.data;
}

export async function indexDocsNoteKnowledge(id: string): Promise<DocsKnowledgeResult> {
    const res = await apiClient.post(`${BASE}/notes/${id}/knowledge`);
    return res.data.data;
}

export async function searchDocsKnowledge(q: string, vaultId?: string): Promise<DocsKnowledgeHit[]> {
    const res = await apiClient.get(`${BASE}/knowledge/search`, {params: {q, vaultId}});
    return res.data.data;
}

export async function createNote(req: NoteRequest): Promise<Note> {
    const res = await apiClient.post(`${BASE}/notes`, req);
    return res.data.data;
}

export async function updateNote(id: string, req: NoteRequest): Promise<Note> {
    const res = await apiClient.put(`${BASE}/notes/${id}`, req);
    return res.data.data;
}

export async function moveNote(id: string, folderId: string | null): Promise<Note> {
    const res = await apiClient.put(`${BASE}/notes/${id}/move`, {folderId});
    return res.data.data;
}

export async function deleteNote(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/notes/${id}`);
}

export async function getNoteVersions(id: string): Promise<NoteVersion[]> {
    const res = await apiClient.get(`${BASE}/notes/${id}/versions`);
    return res.data.data;
}

export async function getBacklinks(id: string): Promise<NoteSummary[]> {
    const res = await apiClient.get(`${BASE}/notes/${id}/backlinks`);
    return res.data.data;
}

// ── 진화 (P3) ──
export async function deriveNote(id: string, req: DeriveRequest): Promise<Note> {
    const res = await apiClient.post(`${BASE}/notes/${id}/derive`, req);
    return res.data.data;
}

export async function changeNoteKind(id: string, kind: NoteKind): Promise<Note> {
    const res = await apiClient.put(`${BASE}/notes/${id}/kind`, {kind});
    return res.data.data;
}

/** noteId 가 있으면 그 노트 주변 depth 단계(로컬), 없으면 접근 가능한 vault 전체 */
export async function getDocsGraph(params: { noteId?: string; depth?: number }): Promise<GraphData> {
    const res = await apiClient.get(`${BASE}/graph`, {params});
    return res.data.data;
}

export async function getLineage(id: string): Promise<LineageNode[]> {
    const res = await apiClient.get(`${BASE}/notes/${id}/lineage`);
    return res.data.data;
}

export async function getDocsTasks(filters: TaskFilters = {}): Promise<DocsTask[]> {
    const res = await apiClient.get(`${BASE}/tasks`, {params: filters});
    return res.data.data;
}

export async function setDocsTaskStatus(noteId: string, lineNo: number, status: TaskStatus): Promise<Note> {
    const res = await apiClient.put(`${BASE}/tasks/${noteId}/${lineNo}`, {status});
    return res.data.data;
}

/** 체크박스 줄을 [[제목]] 노트로 승격 */
export async function promoteDocsTask(noteId: string, lineNo: number): Promise<Note> {
    const res = await apiClient.post(`${BASE}/tasks/${noteId}/${lineNo}/promote`);
    return res.data.data;
}

// ── 이미지 ──
/** 노트에서 쓰는 이미지 주소 (/api/proxy 경유, 세션 토큰은 서버가 붙인다) */
export const docsImageUrl = (id: string) => `/api/proxy${BASE}/images/${id}`;

/** 이미지 바이트를 그대로 보낸다(1MB 이하로 줄여서 — lib/docs/image.ts). 형식은 서버가 판별 */
export async function uploadDocsImage(blob: Blob): Promise<{ id: string }> {
    const res = await apiClient.post(`${BASE}/images`, blob, {headers: {"Content-Type": "application/octet-stream"}});
    return res.data.data;
}
