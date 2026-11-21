"use client";

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
    getLineage,
    getNote,
    getNoteTitles,
    getNoteVersions,
    getNotes,
    moveDocsFolder,
    moveNote,
    promoteDocsTask,
    renameDocsFolder,
    setDocsTaskStatus,
    updateNote,
} from "@/lib/api/docs";
import type {DeriveRequest, NoteFilters, NoteKind, NoteRequest, TaskFilters, TaskStatus} from "@/types/docs";

/**
 * 노트 하나를 저장해도 다른 노트의 백링크·제목 목록·Task·계보가 바뀐다(이름 변경 시 링크 치환 포함).
 * ponytail: 그래서 노트 변경은 "docs" 로 시작하는 키를 모두 무효화한다. 노트 수천 개면 키별로 좁힐 것.
 */
export const invalidateDocs = (qc: QueryClient) =>
    qc.invalidateQueries({predicate: (q) => String(q.queryKey[0]).startsWith("docs")});

// ── 폴더 ──
export function useDocsFolders() {
    return useQuery({queryKey: ["docsFolders"], queryFn: getDocsFolders});
}

export function useCreateDocsFolder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({name, parentId}: { name: string; parentId: string | null }) => createDocsFolder(name, parentId),
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
export function useNotes(filters: NoteFilters = {}) {
    return useQuery({queryKey: ["docsNotes", filters], queryFn: () => getNotes(filters)});
}

export function useNote(id: string) {
    return useQuery({queryKey: ["docsNote", id], queryFn: () => getNote(id), enabled: !!id});
}

export function useNoteTitles(prefix: string, enabled = true) {
    return useQuery({queryKey: ["docsTitles", prefix], queryFn: () => getNoteTitles(prefix), enabled});
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
