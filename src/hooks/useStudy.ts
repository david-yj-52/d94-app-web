"use client";

import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import axios from "axios";
import {
    completeStudyUpload,
    createStudyAnnotation,
    createStudyTerm,
    deleteStudyAnnotation,
    deleteStudyDocument,
    deleteStudyTerm,
    getStudyAnnotations,
    getStudyDocument,
    getStudyDocuments,
    getStudyPage,
    getStudyTerms,
    getStudyToc,
    putStudyUploadPart,
    startStudyUpload,
    updateStudyAnnotation,
    updateStudyTerm,
} from "@/lib/api/study";
import type {CreateAnnotationRequest, StudyDocument, TermRequest, UpdateAnnotationRequest} from "@/types/study";

// ── 문서 ───────────────────────────────────────────────────────────
export function useStudyDocuments() {
    return useQuery({
        queryKey: ["studyDocuments"],
        queryFn: () => getStudyDocuments(),
        // 분석 중인 문서가 있으면 3초마다 다시 본다 (ponytail: 재조회는 목록 화면에만)
        refetchInterval: (q) => (q.state.data?.content.some((d) => d.status === "PARSING") ? 3000 : false),
    });
}

export function useStudyDocument(id: string) {
    return useQuery({queryKey: ["studyDocument", id], queryFn: () => getStudyDocument(id), enabled: !!id});
}

export function useDeleteStudyDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteStudyDocument,
        onSuccess: () => qc.invalidateQueries({queryKey: ["studyDocuments"]}),
    });
}

/** 조각 순차 업로드(실패 시 1회 재시도) → complete. 누락 조각 응답(missing=…)이면 그 조각만 다시 보내고 한 번 더 */
export function useUploadStudyDocument() {
    const qc = useQueryClient();
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const sendPart = async (uploadId: string, file: File, partSize: number, n: number) => {
        const blob = file.slice((n - 1) * partSize, n * partSize);
        try {
            await putStudyUploadPart(uploadId, n, blob);
        } catch {
            await putStudyUploadPart(uploadId, n, blob);
        }
    };

    const upload = async (file: File): Promise<StudyDocument> => {
        setUploading(true);
        setProgress(0);
        try {
            const {uploadId, partSize, partCount} = await startStudyUpload(file.name, file.size);
            for (let n = 1; n <= partCount; n++) {
                await sendPart(uploadId, file, partSize, n);
                setProgress(n / partCount);
            }
            let doc: StudyDocument;
            try {
                doc = await completeStudyUpload(uploadId);
            } catch (e) {
                const message: string = axios.isAxiosError(e) ? (e.response?.data?.message ?? "") : "";
                const missing = message.match(/missing=([\d,]+)/)?.[1];
                if (!missing) throw e;
                for (const n of missing.split(",").map(Number)) await sendPart(uploadId, file, partSize, n);
                doc = await completeStudyUpload(uploadId);
            }
            await qc.invalidateQueries({queryKey: ["studyDocuments"]});
            return doc;
        } finally {
            setUploading(false);
        }
    };

    return {upload, progress, uploading};
}

// ── 목차 · 페이지 ─────────────────────────────────────────────────
export function useStudyToc(id: string, enabled: boolean) {
    return useQuery({queryKey: ["studyToc", id], queryFn: () => getStudyToc(id), enabled: !!id && enabled});
}

export function useStudyPage(id: string, pageSectionId: string | null) {
    return useQuery({
        queryKey: ["studyPage", id, pageSectionId],
        queryFn: () => getStudyPage(id, pageSectionId as string),
        enabled: !!id && !!pageSectionId,
    });
}

// ── 단어장 ────────────────────────────────────────────────────────
export function useStudyTerms(documentId?: string) {
    return useQuery({queryKey: ["studyTerms", documentId ?? "global"], queryFn: () => getStudyTerms(documentId)});
}

function useTermMutation<T>(fn: (arg: T) => Promise<unknown>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: () => {
            qc.invalidateQueries({queryKey: ["studyTerms"]});
            qc.invalidateQueries({queryKey: ["studyPage"]});
        },
    });
}

export const useCreateStudyTerm = () => useTermMutation((req: TermRequest) => createStudyTerm(req));
export const useUpdateStudyTerm = () =>
    useTermMutation(({id, req}: { id: string; req: TermRequest }) => updateStudyTerm(id, req));
export const useDeleteStudyTerm = () => useTermMutation((id: string) => deleteStudyTerm(id));

// ── 마킹 · 노트 ───────────────────────────────────────────────────
export function useStudyAnnotations(documentId?: string) {
    return useQuery({
        queryKey: ["studyAnnotations", documentId ?? "all"],
        queryFn: () => getStudyAnnotations(documentId),
    });
}

function useAnnotationMutation<T>(fn: (arg: T) => Promise<unknown>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: () => {
            qc.invalidateQueries({queryKey: ["studyPage"]});
            qc.invalidateQueries({queryKey: ["studyAnnotations"]});
        },
    });
}

export const useCreateStudyAnnotation = () =>
    useAnnotationMutation((req: CreateAnnotationRequest) => createStudyAnnotation(req));
export const useUpdateStudyAnnotation = () =>
    useAnnotationMutation(({id, req}: { id: string; req: UpdateAnnotationRequest }) => updateStudyAnnotation(id, req));
export const useDeleteStudyAnnotation = () => useAnnotationMutation((id: string) => deleteStudyAnnotation(id));
