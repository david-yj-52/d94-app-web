"use client";

import {DOT_CLASS} from "@/lib/study/colors";
import type {AnnotationListItem, NoteLocation} from "@/types/study";

interface Props {
    items: AnnotationListItem[];
    onOpen: (location: NoteLocation) => void;
}

/** 노트를 문서별로 묶어 보여 준다. 항목을 누르면 그 문장으로 이동한다. */
export default function NoteList({items, onOpen}: Props) {
    if (!items.length) {
        return <p className="py-10 text-center text-sm text-slate-400">아직 마킹하거나 노트를 쓴 내용이 없습니다.</p>;
    }
    const groups = new Map<string, AnnotationListItem[]>();
    items.forEach((a) => groups.set(a.documentTitle, [...(groups.get(a.documentTitle) ?? []), a]));
    return (
        <div className="space-y-8">
            {[...groups].map(([title, list]) => (
                <section key={title}>
                    <h2 className="mb-2 text-sm font-semibold text-slate-500">{title} · {list.length}</h2>
                    <ul className="space-y-2">
                        {list.map((a) => (
                            <li key={a.id}>
                                <button type="button" onClick={() => onOpen(a.location)}
                                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 hover:shadow-sm">
                                    <p className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                                        <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASS[a.color]}`}/>
                                        {a.sectionTitle}
                                        <span className="ml-auto">{new Date(a.createdAt).toLocaleDateString()}</span>
                                    </p>
                                    <p className="line-clamp-3 border-l-4 border-slate-200 pl-3 text-sm italic text-slate-600">{a.quote}</p>
                                    {a.note && <p className="mt-2 whitespace-pre-line text-sm text-slate-900">{a.note}</p>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
