/** d94-query /api/v1/life-metric (삶의 수치화). 날짜는 백엔드 LocalDateTime 문자열 */
export type InputMode = "BASELINE" | "LOG";
export type InputType = "NUMBER" | "DATE";

/** 지표의 입력 항목. BASELINE = 고정 기준값, LOG = 수시로 쌓는 기록(수식에서 sum/avg/count 로 집계) */
export interface InputField {
    key: string;
    label: string;
    type: InputType;
    unit?: string;
    mode: InputMode;
}

export interface MetricTemplate {
    id: string;
    code: string;
    name: string;
    inputSchema: InputField[];
    defaultFormula: string;
    outputUnit: string | null;
}

export interface Metric {
    id: string;
    templateId: string | null;
    code: string;
    name: string;
    inputSchema: InputField[];
    formula: string;
    outputUnit: string | null;
    /** 기준값: 숫자 또는 텍스트(날짜 yyyy-MM-dd) */
    inputs: Record<string, number | string>;
    /** 지금 평가한 값. 계산할 수 없으면 null + error */
    value: number | null;
    error: string | null;
    createdAt: string;
    modifiedAt: string;
}

/** templateId 를 주고 formula 를 비우면 템플릿의 스키마·수식·단위를 쓴다. code 는 생성 후 바꿀 수 없다 */
export interface MetricRequest {
    templateId?: string | null;
    code?: string;
    name?: string;
    inputSchema?: InputField[];
    formula?: string;
    outputUnit?: string | null;
}

export interface MetricLog {
    id: number;
    inputKey: string;
    value: number;
    note: string | null;
    recordedAt: string;
}

export interface LogRequest {
    inputKey: string;
    value: number;
    note?: string;
    recordedAt?: string;
}

export interface EvaluateResult {
    value: number | null;
    unit: string | null;
    error: string | null;
}
