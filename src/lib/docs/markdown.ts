// Docs 노트 Markdown 도우미. 규칙은 d94-query DocsMarkdownIndexer 와 짝(화면 표시·mock 용, 원본 색인은 서버).
import type {LineageNode, NoteKind, TaskStatus} from "@/types/docs";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const WIKILINK = /\[\[([^[\]|#\n]+)(?:#[^[\]|\n]*)?(?:\|([^[\]\n]*))?]]/g;
const TAG = /(?<![\p{L}\p{N}_&/#])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/gu;
export const TASK_LINE = /^(\s*[-*] \[)([ xX/])(] )(.+)$/;
export const KINDS: NoteKind[] = ["idea", "doc", "task", "knowledge"];
export const KIND_LABEL: Record<NoteKind, string> = {idea: "아이디어", doc: "문서", task: "Task", knowledge: "지식"};

/** frontmatter 를 뺀 본문 */
export function stripFrontmatter(content: string): string {
    return content.replace(FRONTMATTER, "");
}

/** frontmatter 의 단순 `key: value` 만 읽는다 (화면 표시용). ponytail: 중첩 YAML 은 서버 색인 결과를 쓴다 */
export function readFrontmatter(content: string): Record<string, string> {
    const m = FRONTMATTER.exec(content);
    if (!m) return {};
    const out: Record<string, string> = {};
    for (const line of m[1].split(/\r?\n/)) {
        const kv = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
        if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
}

/** "[[A]]" · "A" → A */
export function linkTitle(v: string | undefined): string | null {
    if (!v) return null;
    const m = /\[\[([^[\]|#\n]+)/.exec(v);
    const t = (m ? m[1] : v).trim();
    return t || null;
}

export function extractLinks(content: string): string[] {
    const body = stripFrontmatter(content);
    return [...new Set([...body.matchAll(WIKILINK)].map((m) => m[1].trim()).filter(Boolean))];
}

export function extractTags(content: string): string[] {
    const body = stripFrontmatter(content);
    return [...new Set([...body.matchAll(TAG)].map((m) => m[1]).filter((t) => !/^\d+$/.test(t)))];
}

export function statusOf(mark: string): TaskStatus {
    return mark === "x" || mark === "X" ? "done" : mark === "/" ? "doing" : "todo";
}

export function markOf(status: TaskStatus): string {
    return status === "done" ? "x" : status === "doing" ? "/" : " ";
}

export function extractTasks(content: string): { lineNo: number; text: string; status: TaskStatus; dueDt: string | null }[] {
    const fmLines = (FRONTMATTER.exec(content)?.[0].match(/\n/g) ?? []).length;
    return content.split(/\r?\n/).flatMap((line, i) => {
        if (i < fmLines) return [];
        const m = TASK_LINE.exec(line);
        if (!m) return [];
        return [{lineNo: i, text: m[4].trim(), status: statusOf(m[2]), dueDt: /📅\s*(\d{4}-\d{2}-\d{2})/.exec(m[4])?.[1] ?? null}];
    });
}

/** 노트 링크용 href. react-markdown 이 그대로 통과시키고, 화면의 a 컴포넌트가 가로챈다 */
export const NOTE_HREF = "#note:";

/** [[A]]·[[A|별칭]]·[[A#h]] → Markdown 링크 [별칭](#note:A) */
export function toMarkdownLinks(body: string): string {
    return body.replace(WIKILINK, (_, title: string, alias?: string) =>
        `[${(alias || title).trim()}](${NOTE_HREF}${encodeURIComponent(title.trim())})`);
}

export function titleFromHref(href: string | undefined): string | null {
    return href?.startsWith(NOTE_HREF) ? decodeURIComponent(href.slice(NOTE_HREF.length)) : null;
}

/** stream 별 열. 열 순서는 응답(루트부터) 첫 등장 순, 열 안은 세대 → 제목 순 */
export function groupByStream(nodes: LineageNode[]) {
    const byTitle = new Map(nodes.map((n) => [n.title, n]));
    const depthOf = (n: LineageNode) => {
        let d = 0;
        // ponytail: 순환 방지 상한 50 (서버 lineage 와 같은 수준)
        for (let o = n.origin; o && d < 50; o = byTitle.get(o)?.origin ?? null) d++;
        return d;
    };
    const cols = new Map<string | null, { n: LineageNode; depth: number }[]>();
    for (const n of nodes) {
        if (!cols.has(n.stream)) cols.set(n.stream, []);
        cols.get(n.stream)!.push({n, depth: depthOf(n)});
    }
    return [...cols].map(([stream, items]) => ({
        stream,
        items: items.sort((a, b) => a.depth - b.depth || a.n.title.localeCompare(b.n.title)),
    }));
}
