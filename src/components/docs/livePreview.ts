// Obsidian Live Preview 와 비슷한 CodeMirror 확장: 입력 즉시 Markdown 스타일을 입히고,
// 커서가 없는 줄에서는 #·**·`·~~·링크 기호를 숨기며 ![](…) 는 이미지로 보여 준다.
import {HighlightStyle, syntaxHighlighting, syntaxTree} from "@codemirror/language";
import {type Range, type EditorState} from "@codemirror/state";
import {Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType} from "@codemirror/view";
import {tags as t} from "@lezer/highlight";

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Markdown 요소 + 코드 블록 토큰 스타일 (basicSetup 의 기본 스타일은 fallback 이라 이것이 우선) */
export const markdownStyle = syntaxHighlighting(HighlightStyle.define([
    {tag: t.heading1, fontSize: "1.6em", fontWeight: "700", color: "#0f172a"},
    {tag: t.heading2, fontSize: "1.35em", fontWeight: "700", color: "#0f172a"},
    {tag: t.heading3, fontSize: "1.15em", fontWeight: "600", color: "#0f172a"},
    {tag: [t.heading4, t.heading5, t.heading6], fontWeight: "600", color: "#0f172a"},
    {tag: t.strong, fontWeight: "700"},
    {tag: t.emphasis, fontStyle: "italic"},
    {tag: t.strikethrough, textDecoration: "line-through", color: "#94a3b8"},
    {tag: t.link, color: "#2563eb"},
    {tag: t.url, color: "#94a3b8"},
    {tag: t.quote, color: "#64748b", fontStyle: "italic"},
    {tag: t.monospace, fontFamily: MONO, backgroundColor: "#f1f5f9", borderRadius: "4px"},
    {tag: [t.processingInstruction, t.contentSeparator], color: "#94a3b8"},
    // 코드 블록 안 (language-data 로 언어별 파싱)
    {tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#7c3aed"},
    {tag: [t.string, t.special(t.string)], color: "#047857"},
    {tag: t.comment, color: "#94a3b8", fontStyle: "italic"},
    {tag: [t.number, t.bool, t.null], color: "#c2410c"},
    {tag: [t.typeName, t.className], color: "#0369a1"},
    {tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#1d4ed8"},
    {tag: t.propertyName, color: "#0f766e"},
]));

/** 이미지 위젯: 같은 사이트 경로(/…)나 https 만 그린다 */
class ImageWidget extends WidgetType {
    constructor(readonly src: string, readonly alt: string) {
        super();
    }

    eq(other: ImageWidget) {
        return other.src === this.src;
    }

    toDOM() {
        const img = document.createElement("img");
        img.src = this.src;
        img.alt = this.alt;
        img.className = "my-1 inline-block max-h-80 max-w-full rounded border border-slate-200";
        return img;
    }
}

const HIDE = Decoration.replace({});
const SAFE_SRC = /^(\/(?!\/)|https:\/\/)/;

/** 선택(커서)이 닿은 줄 번호들 */
function activeLines(state: EditorState): Set<number> {
    const lines = new Set<number>();
    for (const r of state.selection.ranges) {
        for (let l = state.doc.lineAt(r.from).number; l <= state.doc.lineAt(r.to).number; l++) lines.add(l);
    }
    return lines;
}

function build(view: EditorView): DecorationSet {
    const {state} = view;
    const active = activeLines(state);
    const touches = (from: number, to: number) => {
        for (let l = state.doc.lineAt(from).number; l <= state.doc.lineAt(to).number; l++) if (active.has(l)) return true;
        return false;
    };
    const out: Range<Decoration>[] = [];
    for (const {from, to} of view.visibleRanges) {
        syntaxTree(state).iterate({
            from, to, enter: (node) => {
                const parent = node.node.parent;
                switch (node.name) {
                    case "HeaderMark": {
                        if (parent && touches(parent.from, parent.to)) return;
                        const end = state.sliceDoc(node.to, node.to + 1) === " " ? node.to + 1 : node.to;
                        out.push(HIDE.range(node.from, end));
                        return;
                    }
                    case "EmphasisMark":
                    case "StrikethroughMark":
                        if (parent && !touches(parent.from, parent.to)) out.push(HIDE.range(node.from, node.to));
                        return;
                    case "CodeMark": // 인라인 코드만 (코드 블록 ``` 는 그대로)
                        if (parent?.name === "InlineCode" && !touches(parent.from, parent.to)) out.push(HIDE.range(node.from, node.to));
                        return;
                    case "Link": {
                        if (touches(node.from, node.to)) return;
                        const marks = node.node.getChildren("LinkMark");
                        const url = node.node.getChild("URL");
                        // [텍스트](주소) 만: 앞 [ 와 뒤 ](주소) 를 숨긴다
                        if (marks.length >= 2 && url) {
                            out.push(HIDE.range(marks[0].from, marks[0].to));
                            out.push(HIDE.range(marks[1].from, node.to));
                        }
                        return false;
                    }
                    case "Image": {
                        if (touches(node.from, node.to)) return false;
                        const url = node.node.getChild("URL");
                        const src = url ? state.sliceDoc(url.from, url.to) : "";
                        if (SAFE_SRC.test(src)) {
                            const alt = state.sliceDoc(node.from, node.to).match(/^!\[([^\]]*)]/)?.[1] ?? "";
                            out.push(Decoration.replace({widget: new ImageWidget(src, alt)}).range(node.from, node.to));
                        }
                        return false;
                    }
                }
            },
        });
    }
    return Decoration.set(out, true);
}

/** 커서가 없는 줄의 Markdown 기호를 숨기고 이미지를 그리는 플러그인 */
export const livePreview = ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = build(view);
    }

    update(u: ViewUpdate) {
        if (u.docChanged || u.selectionSet || u.viewportChanged) this.decorations = build(u.view);
    }
}, {decorations: (v) => v.decorations});

/** 에디터 바탕: 본문 글꼴(코드는 MONO), 줄 간격 */
export const editorTheme = EditorView.theme({
    "&": {fontSize: "15px"},
    ".cm-scroller": {fontFamily: "inherit"},
    ".cm-content": {fontFamily: "inherit", lineHeight: "1.75", padding: "12px 4px"},
    ".cm-line": {padding: "0 8px"},
    "&.cm-focused": {outline: "none"},
});
