"use client";

import {
    addMetricLog,
    createMetric,
    deleteMetric,
    deleteMetricLog,
    getMetric,
    getMetricLogs,
    getMetrics,
    getMetricTemplates,
    previewFormula,
    putMetricInputs,
    updateMetric,
} from "@/lib/api/lifeMetric";
import type {LogRequest, MetricRequest} from "@/types/lifeMetric";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEffect, useState} from "react";

// 지표 값은 다른 지표(@code)·로그에 따라 바뀌므로 변경 후에는 life-metric 전체를 무효화한다.
const ROOT = ["life-metric"] as const;

export function useMetricTemplates() {
    return useQuery({queryKey: [...ROOT, "templates"], queryFn: getMetricTemplates, staleTime: Infinity});
}

export function useMetrics() {
    return useQuery({queryKey: [...ROOT, "metrics"], queryFn: getMetrics});
}

export function useMetric(id: string) {
    return useQuery({queryKey: [...ROOT, "metrics", id], queryFn: () => getMetric(id)});
}

export function useMetricLogs(id: string) {
    return useQuery({queryKey: [...ROOT, "metrics", id, "logs"], queryFn: () => getMetricLogs(id)});
}

function useInvalidating<A, R>(fn: (a: A) => Promise<R>) {
    const qc = useQueryClient();
    return useMutation({mutationFn: fn, onSuccess: () => qc.invalidateQueries({queryKey: ROOT})});
}

export const useCreateMetric = () => useInvalidating((req: MetricRequest) => createMetric(req));
export const useUpdateMetric = (id: string) => useInvalidating((req: MetricRequest) => updateMetric(id, req));
export const useDeleteMetric = () => useInvalidating((id: string) => deleteMetric(id));
export const usePutMetricInputs = (id: string) =>
    useInvalidating((values: Record<string, number | string | null>) => putMetricInputs(id, values));
export const useAddMetricLog = (id: string) => useInvalidating((req: LogRequest) => addMetricLog(id, req));
export const useDeleteMetricLog = (id: string) => useInvalidating((logId: number) => deleteMetricLog(id, logId));

/** 수식 미리보기. 입력이 멈추고 400ms 뒤에 한 번 계산한다 */
export function useFormulaPreview(formula: string, inputs: Record<string, number | string>) {
    const [debounced, setDebounced] = useState({formula, inputs});
    const key = JSON.stringify({formula, inputs});
    useEffect(() => {
        const t = setTimeout(() => setDebounced(JSON.parse(key)), 400);
        return () => clearTimeout(t);
    }, [key]);
    return useQuery({
        queryKey: [...ROOT, "preview", debounced],
        queryFn: () => previewFormula(debounced.formula, debounced.inputs),
        enabled: debounced.formula.trim().length > 0,
    });
}
