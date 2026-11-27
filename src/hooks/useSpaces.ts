"use client";

import {
    createSpace,
    deleteSpace,
    getFeatures,
    getGlobalDocRules,
    getSpaceDocRules,
    getSpaces,
    importDocRules,
    saveGlobalDocRules,
    saveSpaceDocRules,
    updateSpace,
} from "@/lib/api/spaces";
import type {DocRule} from "@/types/ciraDocs";
import type {FeatureNode, SaveSpace, Space} from "@/types/space";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useMemo} from "react";

export function useSpaces(projectId?: string) {
    return useQuery({queryKey: ["spaces", projectId], queryFn: () => getSpaces(projectId!), enabled: !!projectId});
}

/**
 * 지금 보고 있는 작업 공간 = URL `?space=<id>`. 없으면 기본 공간.
 * ponytail: URL 이 상태라 새로고침·링크 공유에 그대로 남는다(저장소 직접 접근 금지 규칙). 메뉴 링크는 withSpace 로 이어 붙인다.
 */
export function useCurrentSpace(projectId?: string): {
    space: Space | undefined;
    spaces: Space[];
    spaceId: string | undefined;
    setSpace: (id: string) => void;
    withSpace: (href: string) => string;
} {
    const {data: spaces = []} = useSpaces(projectId);
    const params = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const requested = params.get("space");
    const space = spaces.find((s) => s.id === requested) ?? spaces.find((s) => s.isDefault);
    const withSpace = (href: string) => (space && !space.isDefault ? `${href}${href.includes("?") ? "&" : "?"}space=${space.id}` : href);
    const setSpace = (id: string) => {
        const next = new URLSearchParams(params.toString());
        const target = spaces.find((s) => s.id === id);
        if (target?.isDefault) next.delete("space"); // 방금 만든 공간은 목록에 아직 없을 수 있다

        else next.set("space", id);
        const q = next.toString();
        router.push(q ? `${pathname}?${q}` : pathname);
    };
    return {space, spaces, spaceId: space?.id, setSpace, withSpace};
}

const invalidateSpaces = (qc: ReturnType<typeof useQueryClient>, projectId: string) => {
    qc.invalidateQueries({queryKey: ["spaces", projectId]});
    qc.invalidateQueries({queryKey: ["features", projectId]});
};

export function useCreateSpace(projectId: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: (data: SaveSpace) => createSpace(projectId, data), onSuccess: () => invalidateSpaces(qc, projectId)});
}

export function useUpdateSpace(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({spaceId, data}: { spaceId: string; data: SaveSpace }) => updateSpace(spaceId, data),
        onSuccess: () => invalidateSpaces(qc, projectId),
    });
}

export function useDeleteSpace(projectId: string) {
    const qc = useQueryClient();
    return useMutation({mutationFn: (spaceId: string) => deleteSpace(spaceId), onSuccess: () => invalidateSpaces(qc, projectId)});
}

export function useFeatures(projectId?: string, spaceId?: string | null) {
    return useQuery({
        queryKey: ["features", projectId, spaceId ?? null],
        queryFn: () => getFeatures(projectId!, spaceId),
        enabled: !!projectId,
    });
}

/** 공통 Feature id → Feature (설계 3.2: 공간 보드·목록에서 공통 Feature 에 연결된 Task 를 우선 배지로 먼저 드러낸다) */
export function useCommonFeatures(projectId?: string): Map<string, FeatureNode["feature"]> {
    const {data: tree} = useFeatures(projectId);
    return useMemo(() => {
        const map = new Map<string, FeatureNode["feature"]>();
        const walk = (nodes: FeatureNode[]) => nodes.forEach((n) => {
            if (n.feature.featureScope === "COMMON") map.set(n.feature.id, n.feature);
            walk(n.children);
        });
        walk(tree ?? []);
        return map;
    }, [tree]);
}

// ── 산출물 규칙 3단계 ──

export function useGlobalDocRules() {
    return useQuery({queryKey: ["global-doc-rules"], queryFn: getGlobalDocRules});
}

export function useSaveGlobalDocRules() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({issueTypeId, rules}: { issueTypeId: string; rules: DocRule[] }) => saveGlobalDocRules(issueTypeId, rules),
        onSuccess: (rules) => qc.setQueryData(["global-doc-rules"], rules),
    });
}

export function useImportDocRules(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ruleIds?: string[]) => importDocRules(projectId, ruleIds),
        onSuccess: () => {
            qc.invalidateQueries({queryKey: ["docRules", projectId]});
            qc.invalidateQueries({queryKey: ["space-doc-rules"]});
        },
    });
}

export function useSpaceDocRules(spaceId?: string) {
    return useQuery({queryKey: ["space-doc-rules", spaceId], queryFn: () => getSpaceDocRules(spaceId!), enabled: !!spaceId});
}

export function useSaveSpaceDocRules(spaceId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({issueTypeId, rules}: { issueTypeId: string; rules: DocRule[] }) => saveSpaceDocRules(spaceId, issueTypeId, rules),
        onSuccess: (rules) => qc.setQueryData(["space-doc-rules", spaceId], rules),
    });
}
