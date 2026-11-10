// Study(PDF 학습 뷰어) mock — router.ts 가 registerStudyMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
import type {MockResult} from "./router";
import type {
    AnnotationColor,
    AnnotationListItem,
    PageBlock,
    StudyDocument,
    StudyPage,
    StudyTerm,
    TocNode,
} from "@/types/study";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

interface Sec { id: string; parentId: string | null; level: number; title: string; pageSectionId: string; anchorBlockKey: string }
interface Blk { key: string; sectionId: string; parentKey: string | null; type: PageBlock["type"]; level: number | null; text: string; page: number; row?: number; col?: number }
interface Ann { id: string; documentId: string; startBlockKey: string; startOffset: number; endBlockKey: string; endOffset: number; quote: string; color: AnnotationColor; note: string | null; createdAt: string }
interface Doc { doc: StudyDocument; sections: Sec[]; blocks: Blk[] }
interface StudyStore { docs: Doc[]; terms: StudyTerm[]; annotations: Ann[]; uploads: Record<string, { fileName: string; fileSize: number }>; seq: number }

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, code: string, message: string): MockResult => ({status, body: {success: false, code, message}});
const notFound = fail(404, "STUDY_001", "존재하지 않습니다.");

const SECTIONS: Sec[] = [
    {id: "sec-1", parentId: null, level: 1, title: "Chapter 1: Audit Planning", pageSectionId: "sec-2", anchorBlockKey: "b000001"},
    {id: "sec-2", parentId: "sec-1", level: 2, title: "Audit Planning", pageSectionId: "sec-2", anchorBlockKey: "b000002"},
    {id: "sec-3", parentId: "sec-2", level: 3, title: "Benefits of Audit Planning", pageSectionId: "sec-2", anchorBlockKey: "b000007"},
    {id: "sec-4", parentId: "sec-1", level: 2, title: "Key Aspects for the CISA Exam", pageSectionId: "sec-4", anchorBlockKey: "b000010"},
    {id: "sec-5", parentId: null, level: 1, title: "Chapter 2: Audit Execution", pageSectionId: "sec-6", anchorBlockKey: "b000018"},
    {id: "sec-6", parentId: "sec-5", level: 2, title: "Audit Project Management", pageSectionId: "sec-6", anchorBlockKey: "b000019"},
    {id: "sec-7", parentId: "sec-6", level: 3, title: "Audit Objectives", pageSectionId: "sec-6", anchorBlockKey: "b000021"},
];
const LONG = "An audit plan helps the auditor focus on high-risk areas and estimate the resources required. ".repeat(4);
const BLOCKS: Blk[] = [
    {key: "b000001", sectionId: "sec-1", parentKey: null, type: "HEADING", level: 1, text: "Chapter 1: Audit Planning", page: 26},
    {key: "b000002", sectionId: "sec-2", parentKey: null, type: "HEADING", level: 2, text: "Audit Planning", page: 31},
    {key: "b000003", sectionId: "sec-2", parentKey: null, type: "PARAGRAPH", level: null, text: "Audit planning is the initial stage of the audit process. It helps to establish the overall audit strategy.", page: 31},
    {key: "b000004", sectionId: "sec-2", parentKey: null, type: "LIST_ITEM", level: 1, text: "Audit universe: An inventory of all the functions in the organization.", page: 31},
    {key: "b000005", sectionId: "sec-2", parentKey: null, type: "LIST_ITEM", level: 1, text: "Risk factors: These are factors that have an impact on risk.", page: 31},
    {key: "b000006", sectionId: "sec-2", parentKey: null, type: "PARAGRAPH", level: null, text: LONG.trim(), page: 31},
    {key: "b000007", sectionId: "sec-3", parentKey: null, type: "HEADING", level: 3, text: "Benefits of Audit Planning", page: 31},
    {key: "b000008", sectionId: "sec-3", parentKey: null, type: "PARAGRAPH", level: null, text: "Figure 1.4 summarizes the input and output elements of the audit process:", page: 33},
    {key: "b000009", sectionId: "sec-3", parentKey: null, type: "FIGURE", level: null, text: "Figure 1.4: Audit process flow", page: 33},
    {key: "b000010", sectionId: "sec-4", parentKey: null, type: "HEADING", level: 2, text: "Key Aspects for the CISA Exam", page: 33},
    {key: "b000011", sectionId: "sec-4", parentKey: null, type: "TABLE", level: null, text: "Table 1.2: Key aspects for the CISA exam", page: 33},
    {key: "b000012", sectionId: "sec-4", parentKey: "b000011", type: "TABLE_CELL", level: null, text: "Questions", page: 33, row: 0, col: 0},
    {key: "b000013", sectionId: "sec-4", parentKey: "b000011", type: "TABLE_CELL", level: null, text: "Possible Answers", page: 33, row: 0, col: 1},
    {key: "b000014", sectionId: "sec-4", parentKey: "b000011", type: "TABLE_CELL", level: null, text: "What is the prime reason for the review of an organization chart?", page: 33, row: 1, col: 0},
    {key: "b000015", sectionId: "sec-4", parentKey: "b000011", type: "TABLE_CELL", level: null, text: "To understand the authority and responsibility of individuals.", page: 33, row: 1, col: 1},
    {key: "b000018", sectionId: "sec-5", parentKey: null, type: "HEADING", level: 1, text: "Chapter 2: Audit Execution", page: 64},
    {key: "b000019", sectionId: "sec-6", parentKey: null, type: "HEADING", level: 2, text: "Audit Project Management", page: 65},
    {key: "b000020", sectionId: "sec-6", parentKey: null, type: "PARAGRAPH", level: null, text: "Audit project management covers planning, execution, and reporting of an audit.", page: 65},
    {key: "b000021", sectionId: "sec-7", parentKey: null, type: "HEADING", level: 3, text: "Audit Objectives", page: 66},
    {key: "b000022", sectionId: "sec-7", parentKey: null, type: "PARAGRAPH", level: null, text: "Audit objectives refer to the specific goals that must be achieved by the audit.", page: 66},
];

function seedDoc(id: string, title: string, fileName: string, fileSize: number): Doc {
    return {
        doc: {id, title, fileName, fileSize, pageCount: 357, status: "READY", failReason: null, createdAt: new Date().toISOString()},
        sections: SECTIONS.map((s) => ({...s})),
        blocks: BLOCKS.map((b) => ({...b})),
    };
}

const g = globalThis as unknown as { __studyMockStore?: StudyStore };

function store(): StudyStore {
    g.__studyMockStore ??= {
        docs: [seedDoc("mock-doc-1", "샘플 학습 문서", "sample.pdf", 11_094_606)],
        terms: [{id: "term-1", term: "audit universe", definition: "조직의 감사 대상(기능·프로세스·조직 단위) 전체 목록", documentId: null, scope: "GLOBAL"}],
        annotations: [{
            id: "ann-1", documentId: "mock-doc-1", startBlockKey: "b000003", startOffset: 0, endBlockKey: "b000003", endOffset: 14,
            quote: "Audit planning", color: "yellow", note: "감사의 첫 단계", createdAt: new Date().toISOString(),
        }],
        uploads: {},
        seq: 1,
    };
    return g.__studyMockStore;
}

const findDoc = (id: string) => store().docs.find((d) => d.doc.id === id);
const textOf = (b: Blk) => b.text;

function toc(d: Doc): TocNode[] {
    const node = (s: Sec): TocNode => ({
        id: s.id, title: s.title, level: s.level, pageSectionId: s.pageSectionId, anchorBlockKey: s.anchorBlockKey,
        children: d.sections.filter((c) => c.parentId === s.id).map(node),
    });
    return d.sections.filter((s) => !s.parentId).map(node);
}

function page(d: Doc, pageSectionId: string): StudyPage | null {
    const secs = d.sections.filter((s) => s.pageSectionId === pageSectionId);
    const head = d.sections.find((s) => s.id === pageSectionId);
    if (!secs.length || !head) return null;
    const pages = [...new Set(d.sections.map((s) => s.pageSectionId))];
    const idx = pages.indexOf(pageSectionId);
    const ref = (id: string | undefined) => {
        const s = d.sections.find((x) => x.id === id);
        return s ? {id: s.id, title: s.title} : null;
    };
    const ids = new Set(secs.map((s) => s.id));
    const blocks = d.blocks.filter((b) => ids.has(b.sectionId));
    const terms = store().terms.filter((t) => t.documentId === null || t.documentId === d.doc.id);
    const termHits: StudyPage["termHits"] = [];
    const used: StudyPage["terms"] = {};
    for (const b of blocks) {
        if (b.type === "FIGURE") continue;
        for (const t of terms) {
            const i = textOf(b).toLowerCase().indexOf(t.term.toLowerCase()); // mock: 첫 위치만
            if (i >= 0) {
                termHits.push({blockKey: b.key, start: i, end: i + t.term.length, termId: t.id});
                used[t.id] = {term: t.term, definition: t.definition, scope: t.scope};
            }
        }
    }
    const keys = new Set(blocks.map((b) => b.key));
    return {
        section: {id: head.id, title: head.title},
        prev: ref(pages[idx - 1]),
        next: ref(pages[idx + 1]),
        outline: blocks.filter((b) => b.type === "HEADING" && (b.level ?? 0) > head.level)
            .map((b) => ({blockKey: b.key, title: b.text, level: b.level ?? 3})),
        blocks: blocks.filter((b) => b.type !== "TABLE_CELL").map((b) => ({
            key: b.key, type: b.type, level: b.level, text: b.text, page: b.page,
            cells: b.type === "TABLE" ? blocks.filter((c) => c.parentKey === b.key)
                .map((c) => ({key: c.key, row: c.row ?? 0, col: c.col ?? 0, text: c.text})) : null,
        })),
        termHits,
        terms: used,
        annotations: store().annotations.filter((a) => a.documentId === d.doc.id && keys.has(a.startBlockKey)).map((a) => ({
            id: a.id, startBlockKey: a.startBlockKey, startOffset: a.startOffset, endBlockKey: a.endBlockKey,
            endOffset: a.endOffset, color: a.color, hasNote: !!a.note,
        })),
    };
}

function listItem(a: Ann): AnnotationListItem {
    const d = findDoc(a.documentId);
    const b = d?.blocks.find((x) => x.key === a.startBlockKey);
    const s = d?.sections.find((x) => x.id === b?.sectionId);
    return {
        id: a.id, documentId: a.documentId, documentTitle: d?.doc.title ?? "", sectionTitle: s?.title ?? "",
        quote: a.quote, note: a.note, color: a.color, createdAt: a.createdAt,
        location: {documentId: a.documentId, pageSectionId: s?.pageSectionId ?? null, blockKey: a.startBlockKey},
    };
}

// 1×1 회색 PNG
const PNG = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+P9/PQAJYgOm9CzpFAAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));

export function registerStudyMock(on: On) {
    on("GET", "/v1/study/documents", () => {
        const content = store().docs.map((d) => d.doc);
        return ok({content, totalElements: content.length, totalPages: 1, number: 0, size: 20});
    });
    on("GET", "/v1/study/documents/:id", ({params}) => {
        const d = findDoc(params.id);
        return d ? ok(d.doc) : notFound;
    });
    on("DELETE", "/v1/study/documents/:id", ({params}) => {
        const s = store();
        s.docs = s.docs.filter((d) => d.doc.id !== params.id);
        s.annotations = s.annotations.filter((a) => a.documentId !== params.id);
        s.terms = s.terms.filter((t) => t.documentId !== params.id);
        return ok(null);
    });
    on("POST", "/v1/study/documents/uploads", ({body}) => {
        const fileName = String(body.fileName ?? "");
        const fileSize = Number(body.fileSize ?? 0);
        if (!fileName.toLowerCase().endsWith(".pdf")) return fail(400, "STUDY_002", "PDF 파일만 올릴 수 있습니다.");
        if (fileSize <= 0 || fileSize > 52_428_800) return fail(400, "STUDY_003", "50MB 이하 파일만 올릴 수 있습니다.");
        const uploadId = `up-${store().seq++}`;
        store().uploads[uploadId] = {fileName, fileSize};
        return ok({uploadId, partSize: 786_432, partCount: Math.ceil(fileSize / 786_432)});
    });
    on("PUT", "/v1/study/documents/uploads/:uploadId/parts/:n", ({params}) =>
        store().uploads[params.uploadId] ? ok(null) : notFound);
    on("POST", "/v1/study/documents/uploads/:uploadId/complete", ({params}) => {
        const u = store().uploads[params.uploadId];
        if (!u) return notFound;
        delete store().uploads[params.uploadId];
        // ponytail: PARSING 전환 흉내 없이 바로 READY (시드 구조 복제)
        const d = seedDoc(`mock-doc-${store().seq++}`, u.fileName.replace(/\.pdf$/i, ""), u.fileName, u.fileSize);
        store().docs.unshift(d);
        return ok(d.doc);
    });
    on("GET", "/v1/study/documents/:id/toc", ({params}) => {
        const d = findDoc(params.id);
        return d ? ok(toc(d)) : notFound;
    });
    on("GET", "/v1/study/documents/:id/pages/:pageSectionId", ({params}) => {
        const d = findDoc(params.id);
        const p = d && page(d, params.pageSectionId);
        return p ? ok(p) : notFound;
    });
    on("GET", "/v1/study/documents/:id/figures/:blockKey", () => ({
        status: 200,
        raw: new Response(PNG, {headers: {"Content-Type": "image/png"}}),
    }));

    on("GET", "/v1/study/terms", ({query}) => {
        const documentId = query.get("documentId");
        return ok(store().terms.filter((t) => t.documentId === null || (documentId && t.documentId === documentId)));
    });
    on("POST", "/v1/study/terms", ({body}) => {
        const term = String(body.term ?? "").trim();
        const definition = String(body.definition ?? "").trim();
        const documentId = (body.documentId as string | null) || null;
        if (!term || !definition) return fail(400, "STUDY_009", "단어와 뜻을 입력하세요.");
        if (store().terms.some((t) => t.documentId === documentId && t.term.toLowerCase() === term.toLowerCase()))
            return fail(409, "STUDY_008", "이미 등록된 단어입니다.");
        const t: StudyTerm = {id: `term-${store().seq++}`, term, definition, documentId, scope: documentId ? "DOCUMENT" : "GLOBAL"};
        store().terms.push(t);
        return ok(t);
    });
    on("PUT", "/v1/study/terms/:id", ({params, body}) => {
        const t = store().terms.find((x) => x.id === params.id);
        if (!t) return notFound;
        t.term = String(body.term ?? t.term);
        t.definition = String(body.definition ?? t.definition);
        return ok(t);
    });
    on("DELETE", "/v1/study/terms/:id", ({params}) => {
        store().terms = store().terms.filter((t) => t.id !== params.id);
        return ok(null);
    });

    on("GET", "/v1/study/annotations", ({query}) => {
        const documentId = query.get("documentId");
        return ok(store().annotations.filter((a) => !documentId || a.documentId === documentId).map(listItem).reverse());
    });
    on("POST", "/v1/study/annotations", ({body}) => {
        const d = findDoc(String(body.documentId));
        const sb = d?.blocks.find((b) => b.key === body.startBlockKey);
        const eb = d?.blocks.find((b) => b.key === body.endBlockKey);
        if (!d || !sb || !eb) return fail(400, "STUDY_007", "잘못된 선택 범위입니다.");
        const so = Number(body.startOffset);
        const eo = Number(body.endOffset);
        const quote = sb === eb ? sb.text.slice(so, eo) : `${sb.text.slice(so)}\n…\n${eb.text.slice(0, eo)}`;
        const a: Ann = {
            id: `ann-${store().seq++}`, documentId: d.doc.id, startBlockKey: sb.key, startOffset: so, endBlockKey: eb.key,
            endOffset: eo, quote, color: body.color as AnnotationColor, note: (body.note as string) || null,
            createdAt: new Date().toISOString(),
        };
        store().annotations.push(a);
        return ok(listItem(a));
    });
    on("PATCH", "/v1/study/annotations/:id", ({params, body}) => {
        const a = store().annotations.find((x) => x.id === params.id);
        if (!a) return notFound;
        if (body.color) a.color = body.color as AnnotationColor;
        if (body.note !== undefined) a.note = (body.note as string) || null;
        return ok(listItem(a));
    });
    on("DELETE", "/v1/study/annotations/:id", ({params}) => {
        store().annotations = store().annotations.filter((a) => a.id !== params.id);
        return ok(null);
    });
}
