// 인터페이스 테스트 (UI → /api/proxy → UMD → 백엔드 → DB 통신 확인)

export interface InterfaceTestItemResponse {
    id: string;
    name: string;
    content: string | null;
    status: string;
    /** 마지막으로 반영된 이벤트 (CreateIfTestItem / ReplaceIfTestItem / PatchIfTestItem …) */
    lastEvent: string;
    createdAt: string;
    modifiedAt: string;
}

/** POST·PUT 은 name 필수, PATCH 는 보낸 필드만 반영 */
export interface InterfaceTestItemRequest {
    name?: string;
    content?: string;
    status?: string;
}

export type InterfaceTestMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

/** 화면에서 버튼 하나를 누를 때 보내는 요청 */
export interface InterfaceCallRequest {
    method: InterfaceTestMethod;
    /** 없으면 목록 경로(/v1/interface-tests), 있으면 단건 경로 */
    itemId?: string;
    body?: InterfaceTestItemRequest;
}

/** 호출 한 번의 결과. 실패(4xx·5xx·네트워크 오류)도 예외 대신 이 형태로 돌려준다. */
export interface InterfaceCallResult {
    id: number;
    method: InterfaceTestMethod;
    path: string;
    requestBody?: InterfaceTestItemRequest;
    /** 0 = 응답을 받지 못함 (네트워크 오류) */
    status: number;
    durationMs: number;
    /** UMD 또는 백엔드가 붙인 X-Trace-Id */
    traceId?: string;
    location?: string;
    responseBody?: unknown;
    calledAt: string;
}
