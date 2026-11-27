"use client";

import {useCallback} from "react";
import {useMutation, useQuery, useQueryClient, type QueryClient} from "@tanstack/react-query";
import {
    changeNoteKind,
    createDocsFolder,
    createNote,
    deleteDocsFolder,
    deleteNote,
    deriveNote,
    getBacklinks,
    getDocsFolders,
    getDocsTasks,
    getDocsVaults,
    indexDocsNoteKnowledge,
    getLineage,
    getDocsGraph,
    getNote,
    getNoteTitles,
    getNoteVersions,
    getNotes,
    searchDocsKnowledge,
    moveDocsFolder,
    moveNote,
    promoteDocsTask,
    renameDocsFolder,
    setDocsTaskStatus,
    updateNote,
    docsImageUrl,
    uploadDocsImage,
} from "@/lib/api/docs";
import type {DeriveRequest, NoteFilters, NoteKind, NoteRequest, TaskFilters, TaskStatus, VaultScope} from "@/types/docs";

/**
 * 노트 하나를 저장해도 다른 노트의 백링크·제목 목록·Task·계보가 바뀐다(이름 변경 시 링크 치환 포함).
 * ponytail: 그래서 노트 변경은 "docs" 로 시작하는 키를 모두 무효화한다. 노트 수천 개면 키별로 좁힐 것.
 */
export const invalidateDocs = (qc: QueryClient) =>
    qc.invalidateQueries({predicate: (q) => String(q.queryKey[0]).startsWith("docs")});

/** 편집을 끝낼 때 등, 화면이 Docs 캐시 전체를 새로 받게 한다 */
export function useInvalidateDocs() {
    const qc = useQueryClient();
    return useCallback(() => invalidateDocs(qc), [qc]);
}

// ── vault ──
export function useDocsVaults() {
    return useQuery({queryKey: ["docsVaults"], queryFn: getDocsVaults});
}

// ── 폴더 ──
export function useDocsFolders(vaultId: VaultScope = "ALL") {
    return useQuery({queryKey: ["docsFolders", vaultId], queryFn: () => getDocsFolders(vaultId)});
}

export function useCreateDocsFolder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({name, parentId, vaultId}: { name: string; parentId: string | null; vaultId?: string }) =>
            createDocsFolder(name, parentId, vaultId),
        onSuccess: () => qc.invalidateQueries({queryKey: ["docsFolders"]}),
    });
}

export function useRenameDocsFolder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, name}: { id: string; name: string }) => renameDocsFolder(id, name),
        onSuccess: () => qc.invalidateQueries({queryKey: ["docsFolders"]}),
    });
}

export function useMoveDocsFolder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, parentId}: { id: string; parentId: string | null }) => moveDocsFolder(id, parentId),
        onSuccess: () => qc.invalidateQueries({queryKey: ["docsFolders"]}),
    });
}

export function useDeleteDocsFolder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDocsFolder(id),
        onSuccess: () => qc.invalidateQueries({queryKey: ["docsFolders"]}),
    });
}

// ── 노트 ──
export function useNotes(filters: NoteFilters = {}, enabled = true) {
    return useQuery({queryKey: ["docsNotes", filters], queryFn: () => getNotes(filters), enabled});
}

export function useNote(id: string) {
    return useQuery({queryKey: ["docsNote", id], queryFn: () => getNote(id), enabled: !!id});
}

export function useIndexDocsNoteKnowledge() {
    return useMutation({mutationFn: indexDocsNoteKnowledge});
}

export function useSearchDocsKnowledge() {
    return useMutation({mutationFn: ({query, vaultId}: {query: string; vaultId?: string}) => searchDocsKnowledge(query, vaultId)});
}

export function useNoteTitles(prefix: string, enabled = true) {
    return useQuery({queryKey: ["docsTitles", prefix], queryFn: () => getNoteTitles(prefix), enabled});
}

/** 에디터 [[ 자동완성용: 명령형으로 제목 목록을 가져온다(같은 queryKey 캐시를 공유) */
export function useNoteTitleFetcher() {
    const qc = useQueryClient();
    return useCallback((prefix: string) =>
        qc.fetchQuery({queryKey: ["docsTitles", prefix], queryFn: () => getNoteTitles(prefix), staleTime: 10_000}), [qc]);
}

export function useNoteVersions(id: string | null) {
    return useQuery({queryKey: ["docsNoteVersions", id], queryFn: () => getNoteVersions(id!), enabled: !!id});
}

export function useBacklinks(id: string) {
    return useQuery({queryKey: ["docsBacklinks", id], queryFn: () => getBacklinks(id), enabled: !!id});
}

export function useCreateNote() {
    const qc = useQueryClient();
    return useMutation({mutationFn: (req: NoteRequest) => createNote(req), onSuccess: () => invalidateDocs(qc)});
}

export function useUpdateNote(id: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: (req: NoteRequest) => updateNote(id, req), onSuccess: () => invalidateDocs(qc)});
}

/**
 * 자동 저장 전용: 저장 결과를 ["docsNote", id] 캐시에만 넣고 다른 키는 무효화하지 않는다(1.5초마다 목록·백링크를 다시 받지 않게).
 * 편집을 끝낼 때 화면이 invalidateDocs 를 부른다.
 */
export function useAutosaveNote(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (req: NoteRequest) => updateNote(id, req),
        onSuccess: (note) => qc.setQueryData(["docsNote", id], note),
    });
}

/** 이미지를 올리고 본문에 넣을 주소(/api/proxy/v1/docs/images/{id})를 돌려준다 */
export function useUploadDocsImage() {
    return useMutation({mutationFn: (blob: Blob) => uploadDocsImage(blob).then((r) => docsImageUrl(r.id))});
}

export function useMoveNote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, folderId}: { id: string; folderId: string | null }) => moveNote(id, folderId),
        onSuccess: () => invalidateDocs(qc),
    });
}

export function useDeleteNote() {
    const qc = useQueryClient();
    return useMutation({mutationFn: (id: string) => deleteNote(id), onSuccess: () => invalidateDocs(qc)});
}

// ── 진화 (P3) ──
export function useDeriveNote(id: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: (req: DeriveRequest) => deriveNote(id, req), onSuccess: () => invalidateDocs(qc)});
}

export function useChangeNoteKind(id: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: (kind: NoteKind) => changeNoteKind(id, kind), onSuccess: () => invalidateDocs(qc)});
}

export function useDocsGraph(noteId: string | null, depth: number) {
    return useQuery({
        queryKey: ["docsGraph", noteId, depth],
        queryFn: () => getDocsGraph(noteId ? {noteId, depth} : {}),
    });
}

export function useLineage(id: string) {
    return useQuery({queryKey: ["docsLineage", id], queryFn: () => getLineage(id), enabled: !!id});
}

export function useDocsTasks(filters: TaskFilters = {}) {
    return useQuery({queryKey: ["docsTasks", filters], queryFn: () => getDocsTasks(filters)});
}

export function useSetDocsTaskStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({noteId, lineNo, status}: { noteId: string; lineNo: number; status: TaskStatus }) =>
            setDocsTaskStatus(noteId, lineNo, status),
        onSuccess: () => invalidateDocs(qc),
    });
}

export function usePromoteDocsTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({noteId, lineNo}: { noteId: string; lineNo: number }) => promoteDocsTask(noteId, lineNo),
        onSuccess: () => invalidateDocs(qc),
    });
}
