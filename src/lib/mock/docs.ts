// Docs(Obsidian형 개인 vault) mock — router.ts 가 registerDocsMock(on) 으로 등록한다. dev 서버 재시작 시 초기화.
// 규칙은 d94-query DocsNoteService·DocsFolderService 와 같게(409·404·링크 치환) 맞춘다.
import type {MockResult} from "./router";
import type {DocsFolder, DocsTask, GraphLink, GraphNode, LineageNode, Note, NoteKind, NoteSummary, NoteVersion, TaskStatus} from "@/types/docs";
import {extractLinks, extractTags, extractTasks, KINDS, linkTitle, markOf, readFrontmatter, TASK_LINE} from "@/lib/docs/markdown";

type Ctx = { params: Record<string, string>; query: URLSearchParams; body: Record<string, unknown> };
type On = (method: string, pattern: string, h: (ctx: Ctx) => MockResult | Promise<MockResult>) => void;

interface MNote { id: string; title: string; content: string; folderId: string | null; version: number; createdAt: string; modifiedAt: string }
interface Store { folders: DocsFolder[]; notes: MNote[]; versions: Record<string, NoteVersion[]>; images: Record<string, Uint8Array>; seq: number }

const ok = (data: unknown): MockResult => ({status: 200, body: {success: true, data}});
const fail = (status: number, code: string, message: string): MockResult => ({status, body: {success: false, code, message}});
const notFound = fail(404, "DOCS_NOT_FOUND", "존재하지 않습니다.");

const SEED = `---
kind: doc
---
# Docs 에 오신 것을 환영합니다

아이디어는 텍스트로 시작합니다. [[첫 아이디어]] 처럼 링크를 걸면 노트가 이어집니다. #가이드

- [ ] 첫 노트 작성하기
- [x] Docs 열어 보기`;

const MOCK_VAULT = "mock-private";
const g = globalThis as unknown as { __docsMock?: Store };
function store(): Store {
    if (!g.__docsMock) {
        const now = new Date().toISOString();
        g.__docsMock = {
            folders: [{id: "f-1", vaultId: MOCK_VAULT, parentId: null, name: "가이드", sortOrder: 0}],
            notes: [{id: "n-1", title: "시작하기", content: SEED, folderId: "f-1", version: 1, createdAt: now, modifiedAt: now}],
            versions: {"n-1": [{version: 1, title: "시작하기", content: SEED, editedBy: "admin", editedAt: now}]},
            images: {},
            seq: 2,
        };
    }
    return g.__docsMock;
}

const kindOf = (c: string): NoteKind => {
    const k = (readFrontmatter(c).kind ?? "").toLowerCase() as NoteKind;
    return KINDS.includes(k) ? k : "idea";
};
const streamOf = (c: string) => readFrontmatter(c).stream || null;
const originOf = (c: string) => linkTitle(readFrontmatter(c).origin);
const linksOf = (n: MNote) => [...(originOf(n.content) ? [{title: originOf(n.content)!, rel: "origin" as const}] : []),
    ...extractLinks(n.content).map((title) => ({title, rel: "link" as const}))];

const summary = (n: MNote): NoteSummary => ({id: n.id, vaultId: MOCK_VAULT, title: n.title, folderId: n.folderId, kind: kindOf(n.content), stream: streamOf(n.content), modifiedAt: n.modifiedAt});
function full(n: MNote): Note {
    const titles = new Set(store().notes.map((x) => x.title));
    return {
        ...summary(n), content: n.content, origin: originOf(n.content), version: n.version,
        tags: extractTags(n.content).sort(), links: linksOf(n).map((l) => ({...l, exists: titles.has(l.title)})), createdAt: n.createdAt,
    };
}

const badTitle = (t: string) => !t || t.length > 500 || /[[\]|#\n]/.test(t);
const find = (id: string) => store().notes.find((n) => n.id === id);
const linksTo = (n: MNote, title: string) => linksOf(n).some((l) => l.title === title);
const renameLinks = (c: string, from: string, to: string) =>
    c.replace(new RegExp(`\\[\\[\\s*${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?=[#|\\]])`, "g"), `[[${to}`);

function write(n: MNote, title: string, content: string) {
    // 백엔드처럼 5분 안 같은 제목 재저장은 직전 이력을 바꿔치기
    const vs = (store().versions[n.id] ??= []);
    if (vs[0] && vs[0].title === title && Date.now() - Date.parse(vs[0].editedAt) < 5 * 60_000) vs.shift();
    n.title = title;
    n.content = content;
    n.version += 1;
    n.modifiedAt = new Date().toISOString();
    vs.unshift({version: n.version, title, content, editedBy: "admin", editedAt: n.modifiedAt});
}

function create(title: string, content: string, folderId: string | null): MockResult {
    const s = store();
    if (badTitle(title)) return fail(400, "DOCS_INVALID_REQUEST", "제목은 1~500자이고 []|# 문자를 쓸 수 없습니다.");
    if (s.notes.some((n) => n.title === title)) return fail(409, "DOCS_DUPLICATE_TITLE", "같은 제목의 노트가 이미 있습니다.");
    const now = new Date().toISOString();
    const n: MNote = {id: `n-${s.seq++}`, title, content, folderId, version: 1, createdAt: now, modifiedAt: now};
    s.notes.push(n);
    s.versions[n.id] = [{version: 1, title, content, editedBy: "admin", editedAt: now}];
    return ok(full(n));
}

function tasks(): DocsTask[] {
    return store().notes.flatMap((n) => extractTasks(n.content).map((t) => ({noteId: n.id, noteTitle: n.title, ...t})));
}

export function registerDocsMock(on: On) {
    // ── 폴더 ──
    // ponytail: mock 은 Private vault 하나 (Team vault·CIRA 연동은 실제 백엔드에서만)
    on("GET", "/v1/docs/vaults", () => ok([{id: MOCK_VAULT, type: "PRIVATE", name: "Private", projectId: null}]));
    on("GET", "/v1/docs/folders", () => ok(store().folders));
    on("POST", "/v1/docs/folders", ({body}) => {
        const s = store();
        const name = String(body.name ?? "").trim();
        const parentId = (body.parentId as string) || null;
        if (!name || /[/\\]/.test(name)) return fail(400, "DOCS_INVALID_REQUEST", "폴더 이름을 확인하세요.");
        if (s.folders.some((f) => f.parentId === parentId && f.name === name)) return fail(409, "DOCS_DUPLICATE_FOLDER", "같은 이름의 폴더가 이미 있습니다.");
        const f = {id: `f-${s.seq++}`, vaultId: MOCK_VAULT, parentId, name, sortOrder: 0};
        s.folders.push(f);
        return ok(f);
    });
    on("PUT", "/v1/docs/folders/:id", ({params, body}) => {
        const f = store().folders.find((x) => x.id === params.id);
        if (!f) return notFound;
        f.name = String(body.name ?? f.name).trim();
        return ok(f);
    });
    on("PUT", "/v1/docs/folders/:id/move", ({params, body}) => {
        const s = store();
        const f = s.folders.find((x) => x.id === params.id);
        if (!f) return notFound;
        const parentId = (body.parentId as string) || null;
        for (let p = parentId; p; p = s.folders.find((x) => x.id === p)?.parentId ?? null) {
            if (p === f.id) return fail(400, "DOCS_INVALID_MOVE", "폴더를 자기 자신이나 하위 폴더로 옮길 수 없습니다.");
        }
        f.parentId = parentId;
        return ok(f);
    });
    on("DELETE", "/v1/docs/folders/:id", ({params}) => {
        const s = store();
        if (s.folders.some((f) => f.parentId === params.id) || s.notes.some((n) => n.folderId === params.id)) {
            return fail(409, "DOCS_FOLDER_NOT_EMPTY", "비어 있지 않은 폴더는 삭제할 수 없습니다.");
        }
        s.folders = s.folders.filter((f) => f.id !== params.id);
        return {status: 204};
    });

    // ── 노트 ──
    on("GET", "/v1/docs/notes", ({query}) => {
        const folderId = query.get("folderId");
        const q = query.get("q")?.toLowerCase();
        const kind = query.get("kind");
        const stream = query.get("stream");
        const tag = query.get("tag");
        const origin = query.get("origin");
        const list = store().notes.filter((n) =>
            (folderId === null || (folderId === "" ? n.folderId === null : n.folderId === folderId))
            && (!q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
            && (!kind || kindOf(n.content) === kind) && (!stream || streamOf(n.content) === stream)
            && (!tag || extractTags(n.content).includes(tag)) && (!origin || originOf(n.content) === origin));
        return ok(list.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)).map(summary));
    });
    on("GET", "/v1/docs/notes/titles", ({query}) => {
        const p = (query.get("prefix") ?? "").toLowerCase();
        return ok(store().notes.map((n) => n.title).filter((t) => t.toLowerCase().startsWith(p)).sort().slice(0, 20));
    });
    on("GET", "/v1/docs/notes/by-title", ({query}) => {
        const n = store().notes.find((x) => x.title === query.get("title"));
        return n ? ok(full(n)) : notFound;
    });
    on("POST", "/v1/docs/notes", ({body}) =>
        create(String(body.title ?? "").trim(), String(body.content ?? ""), (body.folderId as string) || null));
    on("GET", "/v1/docs/notes/:id", ({params}) => {
        const n = find(params.id);
        return n ? ok(full(n)) : notFound;
    });
    on("PUT", "/v1/docs/notes/:id", ({params, body}) => {
        const s = store();
        const n = find(params.id);
        if (!n) return notFound;
        if (body.version !== n.version) return fail(409, "DOCS_VERSION_CONFLICT", "다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 저장하세요.");
        const title = body.title === undefined ? n.title : String(body.title).trim();
        let content = body.content === undefined ? n.content : String(body.content);
        if (badTitle(title)) return fail(400, "DOCS_INVALID_REQUEST", "제목은 1~500자이고 []|# 문자를 쓸 수 없습니다.");
        if (title !== n.title) {
            if (s.notes.some((x) => x.title === title && x.id !== n.id)) return fail(409, "DOCS_DUPLICATE_TITLE", "같은 제목의 노트가 이미 있습니다.");
            for (const o of s.notes.filter((x) => x.id !== n.id && linksTo(x, n.title))) write(o, o.title, renameLinks(o.content, n.title, title));
            content = renameLinks(content, n.title, title);
        }
        write(n, title, content);
        return ok(full(n));
    });
    on("PUT", "/v1/docs/notes/:id/move", ({params, body}) => {
        const n = find(params.id);
        if (!n) return notFound;
        n.folderId = (body.folderId as string) || null;
        return ok(full(n));
    });
    on("DELETE", "/v1/docs/notes/:id", ({params}) => {
        const s = store();
        s.notes = s.notes.filter((n) => n.id !== params.id);
        delete s.versions[params.id];
        return {status: 204};
    });
    on("GET", "/v1/docs/notes/:id/versions", ({params}) => ok(store().versions[params.id] ?? []));
    on("GET", "/v1/docs/notes/:id/backlinks", ({params}) => {
        const n = find(params.id);
        if (!n) return notFound;
        return ok(store().notes.filter((x) => x.id !== n.id && linksTo(x, n.title)).map(summary));
    });

    // ── 진화 (P3) ──
    on("POST", "/v1/docs/notes/:id/derive", ({params, body}) => {
        const n = find(params.id);
        if (!n) return notFound;
        const stream = (body.stream as string) || null;
        const kind = (body.kind as string) || "doc";
        const fm = [`kind: ${kind}`, ...(stream ? [`stream: ${stream}`] : []), `origin: "[[${n.title}]]"`].join("\n");
        return create(String(body.title ?? "").trim(), `---\n${fm}\n---\n> 원본: [[${n.title}]]\n\n`, n.folderId);
    });
    on("PUT", "/v1/docs/notes/:id/kind", ({params, body}) => {
        const n = find(params.id);
        if (!n) return notFound;
        const kind = String(body.kind);
        if (!KINDS.includes(kind as NoteKind)) return fail(400, "DOCS_INVALID_REQUEST", "잘못된 요청입니다.");
        const c = /^---\r?\n/.test(n.content)
            ? (/^kind\s*:/m.test(n.content.split(/\n---/)[0]) ? n.content.replace(/^kind\s*:.*$/m, `kind: ${kind}`) : n.content.replace(/^---\r?\n/, `---\nkind: ${kind}\n`))
            : `---\nkind: ${kind}\n---\n${n.content}`;
        write(n, n.title, c);
        return ok(full(n));
    });
    // 서버 DocsNoteService.graph 와 같은 규칙 (vault 하나뿐인 mock)
    on("GET", "/v1/docs/graph", ({query}) => {
        const s = store();
        const byTitle = new Map(s.notes.map((n) => [n.title, n.id]));
        const links: GraphLink[] = [];
        for (const n of s.notes) for (const l of linksOf(n)) {
            const to = byTitle.get(l.title);
            if (to && to !== n.id && !links.some((x) => x.source === n.id && x.target === to && x.rel === l.rel)) links.push({source: n.id, target: to, rel: l.rel});
        }
        const noteId = query.get("noteId");
        let keep: Set<string> | null = null;
        if (noteId) {
            if (!find(noteId)) return notFound;
            keep = new Set([noteId]);
            let frontier = new Set([noteId]);
            for (let d = 0; d < Math.max(1, Math.min(Number(query.get("depth") ?? 1), 5)) && frontier.size; d++) {
                const next = new Set<string>();
                for (const l of links) {
                    if (frontier.has(l.source)) next.add(l.target);
                    if (frontier.has(l.target)) next.add(l.source);
                }
                frontier = new Set([...next].filter((id) => !keep!.has(id)));
                frontier.forEach((id) => keep!.add(id));
            }
        }
        const nodes: GraphNode[] = s.notes.filter((n) => !keep || keep.has(n.id))
            .map((n) => ({id: n.id, vaultId: MOCK_VAULT, title: n.title, kind: kindOf(n.content), stream: streamOf(n.content)}));
        const ids = new Set(nodes.map((n) => n.id));
        return ok({nodes, links: links.filter((l) => ids.has(l.source) && ids.has(l.target))});
    });
    on("GET", "/v1/docs/notes/:id/lineage", ({params}) => {
        const s = store();
        let root = find(params.id);
        if (!root) return notFound;
        for (let i = 0; i < 50; i++) {
            const o = originOf(root.content);
            const p = o ? s.notes.find((x) => x.title === o) : undefined;
            if (!p || p.id === params.id) break;
            root = p;
        }
        const out: LineageNode[] = [];
        const walk = (n: MNote, origin: string | null) => {
            if (out.some((x) => x.id === n.id)) return;
            out.push({id: n.id, title: n.title, kind: kindOf(n.content), stream: streamOf(n.content), origin});
            s.notes.filter((c) => originOf(c.content) === n.title).forEach((c) => walk(c, n.title));
        };
        walk(root, null);
        return ok(out);
    });
    on("GET", "/v1/docs/tasks", ({query}) => {
        const status = query.get("status");
        const tag = query.get("tag");
        const stream = query.get("stream");
        const dueBefore = query.get("dueBefore");
        return ok(tasks().filter((t) => {
            const n = find(t.noteId)!;
            return (!status || t.status === status) && (!tag || extractTags(n.content).includes(tag))
                && (!stream || streamOf(n.content) === stream) && (!dueBefore || (t.dueDt !== null && t.dueDt <= dueBefore));
        }));
    });
    on("PUT", "/v1/docs/tasks/:noteId/:lineNo", ({params, body}) => {
        const n = find(params.noteId);
        if (!n) return notFound;
        const lines = n.content.split("\n");
        const i = Number(params.lineNo);
        const m = TASK_LINE.exec(lines[i] ?? "");
        if (!m) return fail(409, "DOCS_VERSION_CONFLICT", "그 줄은 더 이상 체크박스가 아닙니다. 새로고침하세요.");
        lines[i] = `${m[1]}${markOf(body.status as TaskStatus)}${m[3]}${m[4]}`;
        write(n, n.title, lines.join("\n"));
        return ok(full(n));
    });
    on("POST", "/v1/docs/tasks/:noteId/:lineNo/promote", ({params}) => {
        const n = find(params.noteId);
        if (!n) return notFound;
        const lines = n.content.split("\n");
        const i = Number(params.lineNo);
        const m = TASK_LINE.exec(lines[i] ?? "");
        if (!m) return fail(409, "DOCS_VERSION_CONFLICT", "그 줄은 더 이상 체크박스가 아닙니다. 새로고침하세요.");
        const title = m[4].replace(/📅\s*\d{4}-\d{2}-\d{2}/, "").replace(/[[\]|#]/g, "").trim();
        const r = create(title, `---\nkind: task\norigin: "[[${n.title}]]"\n---\n`, n.folderId);
        if (r.status !== 200) return r;
        lines[i] = `${m[1]}${m[2]}${m[3]}[[${title}]]`;
        write(n, n.title, lines.join("\n"));
        return r;
    });

    // ── 이미지 (백엔드와 같은 형식 판별, 바이트는 메모리) ──
    on("POST", "/v1/docs/images", ({body}) => {
        const bytes = body.bytes as Uint8Array | undefined;
        if (!bytes || !sniff(bytes)) return fail(400, "DOCS_INVALID_REQUEST", "PNG·JPEG·GIF·WebP 이미지만 올릴 수 있습니다.");
        const id = crypto.randomUUID();
        store().images[id] = bytes;
        return ok({id});
    });
    on("GET", "/v1/docs/images/:id", ({params}) => {
        const bytes = store().images[params.id];
        if (!bytes) return notFound;
        return {status: 200, raw: new Response(new Blob([bytes as BlobPart]), {headers: {"Content-Type": sniff(bytes)!}})};
    });
}

function sniff(b: Uint8Array): string | null {
    const s = (...sig: number[]) => sig.every((v, i) => b[i] === v);
    if (s(0x89, 0x50, 0x4e, 0x47)) return "image/png";
    if (s(0xff, 0xd8, 0xff)) return "image/jpeg";
    if (s(0x47, 0x49, 0x46, 0x38)) return "image/gif";
    if (s(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
    return null;
}
