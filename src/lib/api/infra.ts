import apiClient from "./client";
import type {InfraMetric, InfraNode, InfraService, MetricRange, NodeDetail, NodeSummary} from "@/types/infra";

const BASE = "/v1/infra";

export async function getInfraNodes(): Promise<NodeSummary[]> {
    const res = await apiClient.get(`${BASE}/nodes`);
    return res.data.data;
}

export async function getInfraNode(nodeKey: string): Promise<NodeDetail> {
    const res = await apiClient.get(`${BASE}/nodes/${encodeURIComponent(nodeKey)}`);
    return res.data.data;
}

export async function getInfraMetrics(nodeKey: string, range: MetricRange): Promise<InfraMetric[]> {
    const res = await apiClient.get(`${BASE}/nodes/${encodeURIComponent(nodeKey)}/metrics`, {params: {range}});
    return res.data.data;
}

export async function createInfraNode(node: InfraNode): Promise<NodeSummary> {
    const res = await apiClient.post(`${BASE}/nodes`, node);
    return res.data.data;
}

export async function updateInfraNode(nodeKey: string, node: InfraNode): Promise<NodeSummary> {
    const res = await apiClient.put(`${BASE}/nodes/${encodeURIComponent(nodeKey)}`, node);
    return res.data.data;
}

export async function deleteInfraNode(nodeKey: string): Promise<void> {
    await apiClient.delete(`${BASE}/nodes/${encodeURIComponent(nodeKey)}`);
}

export async function saveInfraService(nodeKey: string, svc: InfraService): Promise<InfraService> {
    const base = `${BASE}/nodes/${encodeURIComponent(nodeKey)}/services`;
    const res = svc.id == null ? await apiClient.post(base, svc) : await apiClient.put(`${base}/${svc.id}`, svc);
    return res.data.data;
}

export async function deleteInfraService(nodeKey: string, id: number): Promise<void> {
    await apiClient.delete(`${BASE}/nodes/${encodeURIComponent(nodeKey)}/services/${id}`);
}
