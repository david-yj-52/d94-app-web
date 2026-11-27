"use client";

import ReactMarkdown, {type Components} from "react-markdown";
import remarkGfm from "remark-gfm";
import {stripFrontmatter, titleFromHref, toMarkdownLinks} from "@/lib/docs/markdown";
import CodeBlock from "./CodeBlock";
import MermaidDiagram from "./MermaidDiagram";
import Button from "@/components/ui/Button";

interface NoteMarkdownProps {
    content: string;
    /** 실제로 있는 노트 제목 (없는 노트 링크는 흐리게) */
    existing: Set<string>;
    onOpenTitle: (title: string) => void;
}

/** frontmatter 를 뺀 본문을 렌더링. [[링크]] 는 노트 이동, 없는 노트면 흐리게(클릭 시 생성). ponytail: typography 플러그인 없이 요소별 클래스 */
export default function NoteMarkdown({content, existing, onOpenTitle}: NoteMarkdownProps) {
    const components: Components = {
        h1: (p) => <h1 className="mb-3 mt-6 text-2xl font-bold text-slate-900" {...p}/>,
        h2: (p) => <h2 className="mb-2 mt-5 text-xl font-semibold text-slate-900" {...p}/>,
        h3: (p) => <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900" {...p}/>,
        p: (p) => <p className="my-2 leading-7" {...p}/>,
        ul: (p) => <ul className="my-2 list-disc pl-6" {...p}/>,
        ol: (p) => <ol className="my-2 list-decimal pl-6" {...p}/>,
        table: (p) => <div className="my-3 overflow-x-auto"><table className="min-w-full border-collapse text-sm" {...p}/></div>,
        th: (p) => <th className="border border-slate-200 bg-slate-50 px-3 py-1.5 text-left font-semibold" {...p}/>,
        td: (p) => <td className="border border-slate-200 px-3 py-1.5" {...p}/>,
        del: (p) => <del className="text-slate-400" {...p}/>,
        input: (p) => <input {...p} disabled className="mr-1 align-middle"/>,
        li: (p) => <li {...p} className={p.className?.includes("task-list-item") ? "-ml-5 list-none" : undefined}/>,
        blockquote: (p) => <blockquote className="my-3 border-l-4 border-slate-200 pl-3 text-slate-500" {...p}/>,
        // 코드 블록은 code 가 직접 그린다(언어 → 하이라이트, mermaid → 다이어그램). pre 는 감싸지 않음
        pre: ({children}) => <>{children}</>,
        code: ({className, children}) => {
            const text = String(children ?? "");
            const lang = /language-([\w-]+)/.exec(className ?? "")?.[1]?.toLowerCase() ?? null;
            if (lang === "mermaid") return <MermaidDiagram code={text.replace(/\n$/, "")}/>;
            if (lang || text.includes("\n")) return <CodeBlock code={text.replace(/\n$/, "")} language={lang}/>;
            return <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">{children}</code>;
        },
        img: ({src, alt}) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy"
                                  className="my-2 max-h-[32rem] max-w-full rounded border border-slate-200"/>,
        a: ({href, children}) => {
            const title = titleFromHref(href);
            if (title === null) return <a href={href} target="_blank" rel="noreferrer" className="text-d94-brand underline">{children}</a>;
            return (
                <Button variant="unstyled" type="button" onClick={() => onOpenTitle(title)}
                        className={existing.has(title) ? "text-d94-brand hover:underline" : "text-slate-400 hover:underline"}
                        title={existing.has(title) ? title : `${title} (없는 노트 — 클릭하면 만듭니다)`}>
                    {children}
                </Button>
            );
        },
    };
    return (
        <div className="text-slate-700 [&>*:first-child]:mt-0">
            <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>{toMarkdownLinks(stripFrontmatter(content))}</ReactMarkdown>
        </div>
    );
}
