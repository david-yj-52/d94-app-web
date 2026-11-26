"use client";

import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    deriveIssueDoc,
    ensureIssueMainDoc,
    getDocRules,
    getIssueDocs,
    getIssueTypes,
    promoteNoteToCira,
    saveDocRules,
} from "@/lib/api/ciraDocs";
import {invalidateDocs} from "@/hooks/useDocs";
import type {DeriveFromIssueRequest, DocRule} from "@/types/ciraDocs";

export function useIssueTypes() {
    return useQuery({queryKey: ["issueTypes"], queryFn: getIssueTypes, staleTime: 5 * 60_000});
}

export function useDocRules(projectId: string) {
    return useQuery({queryKey: ["docRules", projectId], queryFn: () => getDocRules(projectId), enabled: !!projectId});
}

export function useSaveDocRules(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({issueTypeId, rules}: { issueTypeId: string; rules: DocRule[] }) => saveDocRules(projectId, issueTypeId, rules),
        onSuccess: () => qc.invalidateQueries({queryKey: ["docRules", projectId]}),
    });
}

/** queryKey 가 "docs" 로 시작해 노트 변경(invalidateDocs) 때 함께 새로 받는다 */
export function useIssueDocs(projectId: string, issueId: string) {
    return useQuery({queryKey: ["docsIssue", projectId, issueId], queryFn: () => getIssueDocs(projectId, issueId)});
}

export function useEnsureIssueMainDoc(projectId: string, issueId: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: () => ensureIssueMainDoc(projectId, issueId), onSuccess: () => invalidateDocs(qc)});
}

export function useDeriveIssueDoc(projectId: string, issueId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (req: DeriveFromIssueRequest) => deriveIssueDoc(projectId, issueId, req),
        onSuccess: () => invalidateDocs(qc),
    });
}

export function usePromoteNoteToCira() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({projectId, noteId, issueTypeId, title}: { projectId: string; noteId: string; issueTypeId?: string; title?: string }) =>
            promoteNoteToCira(projectId, noteId, issueTypeId, title),
        onSuccess: () => {
            invalidateDocs(qc);
            qc.invalidateQueries({queryKey: ["issues"]});
        },
    });
}
