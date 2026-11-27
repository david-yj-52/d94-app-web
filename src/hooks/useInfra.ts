"use client";

import {
    createInfraNode,
    deleteInfraNode,
    deleteInfraService,
    getInfraMetrics,
    getInfraNode,
    getInfraNodes,
    saveInfraService,
    updateInfraNode,
} from "@/lib/api/infra";
import type {InfraNode, InfraService, MetricRange} from "@/types/infra";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

// 에이전트가 60초마다 보고하므로 화면도 60초마다 다시 읽는다
const ROOT = ["infra"] as const;
const REFRESH = 60_000;

export function useInfraNodes() {
    return useQuery({queryKey: [...ROOT, "nodes"], queryFn: getInfraNodes, refetchInterval: REFRESH});
}

export function useInfraNode(nodeKey: string) {
    return useQuery({queryKey: [...ROOT, "nodes", nodeKey], queryFn: () => getInfraNode(nodeKey), refetchInterval: REFRESH});
}

export function useInfraMetrics(nodeKey: string, range: MetricRange) {
    return useQuery({
        queryKey: [...ROOT, "nodes", nodeKey, "metrics", range],
        queryFn: () => getInfraMetrics(nodeKey, range),
        refetchInterval: REFRESH,
    });
}

function useInvalidating<A, R>(fn: (a: A) => Promise<R>) {
    const qc = useQueryClient();
    return useMutation({mutationFn: fn, onSuccess: () => qc.invalidateQueries({queryKey: ROOT})});
}

/** originalKey 가 있으면 수정, 없으면 생성 */
export const useSaveInfraNode = () => useInvalidating(({node, originalKey}: { node: InfraNode; originalKey?: string }) =>
    originalKey ? updateInfraNode(originalKey, node) : createInfraNode(node));
export const useDeleteInfraNode = () => useInvalidating((nodeKey: string) => deleteInfraNode(nodeKey));
export const useSaveInfraService = (nodeKey: string) => useInvalidating((svc: InfraService) => saveInfraService(nodeKey, svc));
export const useDeleteInfraService = (nodeKey: string) => useInvalidating((id: number) => deleteInfraService(nodeKey, id));
