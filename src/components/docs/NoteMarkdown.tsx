"use client";

import ReactMarkdown, {type Components} from "react-markdown";
import {stripFrontmatter, titleFromHref, toMarkdownLinks} from "@/lib/docs/markdown";

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
        blockquote: (p) => <blockquote className="my-3 border-l-4 border-slate-200 pl-3 text-slate-500" {...p}/>,
        code: (p) => <code className="rounded bg-slate-100 px-1 py-0.5 text-sm" {...p}/>,
        pre: (p) => <pre className="my-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-sm" {...p}/>,
        a: ({href, children}) => {
            const title = titleFromHref(href);
            if (title === null) return <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline">{children}</a>;
            return (
                <button type="button" onClick={() => onOpenTitle(title)}
                        className={existing.has(title) ? "text-blue-600 hover:underline" : "text-slate-400 hover:underline"}
                        title={existing.has(title) ? title : `${title} (없는 노트 — 클릭하면 만듭니다)`}>
                    {children}
                </button>
            );
        },
    };
    return (
        <div className="text-slate-700 [&>*:first-child]:mt-0">
            <ReactMarkdown components={components}>{toMarkdownLinks(stripFrontmatter(content))}</ReactMarkdown>
        </div>
    );
}
