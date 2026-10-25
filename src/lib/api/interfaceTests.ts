import apiClient from "./client";
import type {
    InterfaceCallRequest,
    InterfaceCallResult,
    InterfaceTestItemResponse,
} from "@/types/interfaceTest";

const BASE = "/v1/interface-tests";

let callSeq = 0;

export async function getInterfaceTestItems(): Promise<InterfaceTestItemResponse[]> {
    const res = await apiClient.get(BASE);
    return res.data.data;
}

/**
 * 메서드 하나를 그대로 호출하고 상태코드·소요시간·Trace ID·본문을 돌려준다.
 * 통신 확인이 목적이라 res.data.data 대신 응답 전체를 남기며, 4xx·5xx 도 throw 하지 않는다.
 */
export async function callInterfaceTest(req: InterfaceCallRequest): Promise<InterfaceCallResult> {
    const path = req.itemId ? `${BASE}/${encodeURIComponent(req.itemId)}` : BASE;
    const hasBody = req.method === "POST" || req.method === "PUT" || req.method === "PATCH";
    const started = performance.now();
    const base = {
        id: ++callSeq,
        method: req.method,
        path,
        requestBody: hasBody ? req.body : undefined,
        calledAt: new Date().toISOString(),
    };

    try {
        const res = await apiClient.request({
            method: req.method,
            url: path,
            data: hasBody ? req.body : undefined,
            validateStatus: () => true,
        });
        return {
            ...base,
            status: res.status,
            durationMs: Math.round(performance.now() - started),
            traceId: res.headers["x-trace-id"],
            location: res.headers["location"],
            responseBody: res.data === "" ? undefined : res.data,
        };
    } catch (error) {
        return {
            ...base,
            status: 0,
            durationMs: Math.round(performance.now() - started),
            responseBody: {error: error instanceof Error ? error.message : String(error)},
        };
    }
}
