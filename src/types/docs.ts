// Docs(Obsidian형 개인 vault) — d94-query DocsDtos 와 필드명이 같다. ID 는 문자열(UUID).

export type NoteKind = "idea" | "doc" | "task" | "knowledge";
export type TaskStatus = "todo" | "doing" | "done";

export interface DocsFolder {
    id: string;
    parentId: string | null;
    name: string;
    sortOrder: number;
}

export interface NoteSummary {
    id: string;
    title: string;
    folderId: string | null;
    kind: NoteKind;
    stream: string | null;
    modifiedAt: string | null;
}

/** exists=false 면 아직 없는 노트를 가리키는 링크. rel=origin 은 frontmatter origin */
export interface NoteLink {
    title: string;
    rel: "link" | "origin";
    exists: boolean;
}

export interface Note {
    id: string;
    title: string;
    /** frontmatter 포함 Markdown 원문 */
    content: string;
    folderId: string | null;
    kind: NoteKind;
    stream: string | null;
    origin: string | null;
    version: number;
    tags: string[];
    links: NoteLink[];
    createdAt: string | null;
    modifiedAt: string | null;
}

export interface NoteRequest {
    title?: string;
    content?: string;
    folderId?: string | null;
    /** 수정 시 필수 (낙관적 잠금) */
    version?: number;
}

export interface NoteFilters {
    /** "" = 최상위만, 생략 = 전체 */
    folderId?: string;
    q?: string;
    kind?: NoteKind;
    stream?: string;
    tag?: string;
    origin?: string;
}

export interface NoteVersion {
    version: number;
    title: string;
    content: string;
    editedBy: string | null;
    editedAt: string;
}

export interface DeriveRequest {
    title: string;
    stream?: string | null;
    kind?: NoteKind;
}

export interface DocsTask {
    noteId: string;
    noteTitle: string;
    /** 본문 줄 번호(0부터) */
    lineNo: number;
    text: string;
    status: TaskStatus;
    dueDt: string | null;
}

export interface TaskFilters {
    status?: TaskStatus;
    tag?: string;
    stream?: string;
    dueBefore?: string;
}

export interface LineageNode {
    id: string;
    title: string;
    kind: NoteKind;
    stream: string | null;
    /** origin 노트 제목. 루트는 null */
    origin: string | null;
}
