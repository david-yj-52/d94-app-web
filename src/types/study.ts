// PDF 학습 뷰어(study) — d94-query StudyDtos 와 필드명이 같다. ID 는 모두 문자열(UUID).

export type DocumentStatus = "PARSING" | "READY" | "FAILED";

export interface StudyDocument {
    id: string;
    title: string;
    fileName: string;
    fileSize: number;
    pageCount: number | null;
    status: DocumentStatus;
    failReason: string | null;
    createdAt: string;
}

export interface StartUploadResponse {
    uploadId: string;
    partSize: number;
    partCount: number;
}

export interface TocNode {
    id: string;
    title: string;
    level: number;
    pageSectionId: string;
    anchorBlockKey: string;
    children: TocNode[];
}

export type BlockType = "HEADING" | "PARAGRAPH" | "LIST_ITEM" | "TABLE" | "TABLE_CELL" | "FIGURE";

export interface PageCell {
    key: string;
    row: number;
    col: number;
    text: string;
}

export interface PageBlock {
    key: string;
    type: BlockType;
    level: number | null;
    text: string;
    page: number | null;
    cells: PageCell[] | null;
}

export interface TermHit {
    blockKey: string;
    start: number;
    end: number;
    termId: string;
}

export type TermScope = "GLOBAL" | "DOCUMENT";

export interface TermDef {
    term: string;
    definition: string;
    scope: TermScope;
}

export type AnnotationColor = "yellow" | "green" | "blue" | "pink";

export interface PageAnnotation {
    id: string;
    startBlockKey: string;
    startOffset: number;
    endBlockKey: string;
    endOffset: number;
    color: AnnotationColor;
    hasNote: boolean;
}

export interface SectionRef {
    id: string;
    title: string;
}

export interface StudyPage {
    section: SectionRef;
    prev: SectionRef | null;
    next: SectionRef | null;
    outline: { blockKey: string; title: string; level: number }[];
    blocks: PageBlock[];
    termHits: TermHit[];
    terms: Record<string, TermDef>;
    annotations: PageAnnotation[];
}

export interface StudyTerm {
    id: string;
    term: string;
    definition: string;
    documentId: string | null;
    scope: TermScope;
}

export interface TermRequest {
    term: string;
    definition: string;
    documentId?: string | null;
}

export interface NoteLocation {
    documentId: string;
    pageSectionId: string | null;
    blockKey: string;
}

export interface AnnotationListItem {
    id: string;
    documentId: string;
    documentTitle: string;
    sectionTitle: string;
    quote: string;
    note: string | null;
    color: AnnotationColor;
    createdAt: string;
    location: NoteLocation;
}

export interface CreateAnnotationRequest {
    documentId: string;
    startBlockKey: string;
    startOffset: number;
    endBlockKey: string;
    endOffset: number;
    color: AnnotationColor;
    note?: string;
}

export interface UpdateAnnotationRequest {
    color?: AnnotationColor;
    note?: string;
}
