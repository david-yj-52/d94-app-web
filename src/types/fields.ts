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
    /** 사용자 정의 필드의 소속 (sys 는 null) */
    scope?: "global" | "type" | "project" | null;
    /** 복사해 온 원본 id·이름 (원본이 지워졌으면 sourceName null) */
    sourceFieldId?: string | null;
    sourceName?: string | null;
    createdBy?: string | null;
    /** 현재 사용자가 이 프로젝트 필드를 수정·삭제할 수 있는지 (만든 사람 또는 프로젝트 ADMIN) */
    canEdit?: boolean;
}

/** 프로젝트가 가져올 수 있는 전역·타입 필드. importedAs = 이미 가져온 복사본 fieldKey */
export interface LibraryItem {
    field: FieldDef;
    importedAs?: string | null;
}

export interface FieldCatalog {
    system: FieldDef[];
    /** 전역 필드 */
    custom: FieldDef[];
    /** 타입 id → 그 타입의 타입 필드 */
    typeFields: Record<string, FieldDef[]>;
    /** 전역 필드 id → 복사본 수 (0 이면 어디에도 적용되지 않음) */
    copies: Record<string, number>;
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
    /** 이 프리셋으로 만든 작업 공간 수 (참고용 — 만든 뒤에는 연결이 없다) */
    spaceCount: number;
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
    /** 전역 필드를 만들 때만: 이 타입들로 바로 복사 */
    copyToTypeIds?: string[];
}

export interface FieldUsage {
    copies: number;
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
