import apiClient from "./client";
import type {EvaluateResult, LogRequest, Metric, MetricLog, MetricRequest, MetricTemplate} from "@/types/lifeMetric";

const BASE = "/v1/life-metric";

export async function getMetricTemplates(): Promise<MetricTemplate[]> {
    const res = await apiClient.get(`${BASE}/templates`);
    return res.data.data;
}

export async function getMetrics(): Promise<Metric[]> {
    const res = await apiClient.get(`${BASE}/metrics`);
    return res.data.data;
}

export async function getMetric(id: string): Promise<Metric> {
    const res = await apiClient.get(`${BASE}/metrics/${id}`);
    return res.data.data;
}

export async function createMetric(req: MetricRequest): Promise<Metric> {
    const res = await apiClient.post(`${BASE}/metrics`, req);
    return res.data.data;
}

export async function updateMetric(id: string, req: MetricRequest): Promise<Metric> {
    const res = await apiClient.put(`${BASE}/metrics/${id}`, req);
    return res.data.data;
}

export async function deleteMetric(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/metrics/${id}`);
}

/** 값 null·"" = 삭제 */
export async function putMetricInputs(id: string, values: Record<string, number | string | null>): Promise<Metric> {
    const res = await apiClient.put(`${BASE}/metrics/${id}/inputs`, {values});
    return res.data.data;
}

export async function getMetricLogs(id: string, key?: string): Promise<MetricLog[]> {
    const res = await apiClient.get(`${BASE}/metrics/${id}/logs`, {params: {key, limit: 500}});
    return res.data.data;
}

export async function addMetricLog(id: string, req: LogRequest): Promise<MetricLog> {
    const res = await apiClient.post(`${BASE}/metrics/${id}/logs`, req);
    return res.data.data;
}

export async function deleteMetricLog(id: string, logId: number): Promise<void> {
    await apiClient.delete(`${BASE}/metrics/${id}/logs/${logId}`);
}

/** 저장 전 미리보기: 기준값은 inputs, @code 는 내 지표, 로그 집계는 0 */
export async function previewFormula(formula: string, inputs: Record<string, number | string>): Promise<EvaluateResult> {
    const res = await apiClient.post(`${BASE}/preview`, {formula, inputs});
    return res.data.data;
}
