// CIRA Task ↔ Docs — d94-query CiraDocsService 레코드와 필드명이 같다.
import type {LineageNode, NoteKind} from "@/types/docs";

/** 프로젝트 · Task 타입별 파생 문서 폴더 슬롯 */
export interface DocRule {
    id: string | null;
    issueTypeId: string | null;
    folderName: string;
    sortOrder: number | null;
    defaultKind: NoteKind | null;
    defaultStream: string | null;
    templateContent: string | null;
    /** true 면 Task 생성 때 폴더를 바로 만든다. false 면 첫 파생 때 */
    autoCreate: boolean;
    /** 응답만: GLOBAL(전사 기준정보) | PROJECT(프로젝트 공통) | SPACE */
    scope?: "GLOBAL" | "PROJECT" | "SPACE" | null;
    spaceId?: string | null;
    sourceRuleId?: string | null;
    /** 기준정보에서 가져온 규칙 — 공간·프로젝트에서 지우거나 바꿀 수 없다 */
    locked?: boolean | null;
}

export interface LinkedDoc {
    noteId: string;
    vaultId: string;
    title: string;
    folderId: string | null;
    kind: NoteKind;
    stream: string | null;
    role: "MAIN" | "DERIVED";
    ruleId: string | null;
}

/** main 이 null 이면 아직 메인 노트가 없다(배포 전 Task) */
export interface IssueDocs {
    main: LinkedDoc | null;
    derived: LinkedDoc[];
    lineage: LineageNode[];
    rules: DocRule[];
}

/** ruleId 가 있으면 그 슬롯, 없으면 folderName(선택)으로 자유 파생 */
export interface DeriveFromIssueRequest {
    title: string;
    ruleId?: string | null;
    folderName?: string | null;
}

export interface IssueType {
    id: string;
    typeNm: string;
}
