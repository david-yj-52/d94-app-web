/** CIRA 필드 (d94-query CiraFieldDto). 키: 기본 'sys:<name>', 사용자 정의 'cf:<id>' */
export type CustomFieldType =
    "TEXT" | "NUMBER" | "DATE" | "DATETIME" | "SELECT" | "MULTI_SELECT" | "USER" | "URL" | "CHECKBOX";

export interface FieldDef {
    fieldKey: string;
    name: string;
    kind: "sys" | "cf";
    fieldType: CustomFieldType;
    options?: string[] | null;
    required: boolean;
    sortable: boolean;
    /** 프로젝트 유효 필드에서만: fixed | type | project */
    source?: "fixed" | "type" | "project" | null;
    defaultVisible: boolean;
    projectId?: string | null;
}

export interface FieldCatalog {
    system: FieldDef[];
    custom: FieldDef[];
}

export interface TypeField {
    fieldKey: string;
    defaultVisible: boolean;
}

export interface ProjectTypeResponse {
    id: string;
    typeNm: string;
    descr?: string | null;
    sortOrd: number;
    projectCount: number;
    fields: TypeField[];
}

export interface SaveProjectType {
    typeNm: string;
    descr?: string;
}

export interface SaveCustomField {
    fieldNm: string;
    fieldType: CustomFieldType;
    required?: boolean;
    options?: string[];
}

export interface FieldUsage {
    projects: number;
    issues: number;
}

/** 모든 타입·프로젝트에 항상 있는 필드 (세트에서 뺄 수 없음) */
export const FIXED_FIELD_KEYS = ["sys:type", "sys:key", "sys:summary", "sys:status"];
/** 목록에서 숨길 수 없는 필드 (행 식별) */
export const ALWAYS_SHOWN_KEYS = ["sys:key", "sys:summary"];

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
    TEXT: "텍스트",
    NUMBER: "숫자",
    DATE: "날짜",
    DATETIME: "날짜·시간",
    SELECT: "선택형",
    MULTI_SELECT: "다중 선택",
    USER: "사용자",
    URL: "URL",
    CHECKBOX: "체크박스",
};
