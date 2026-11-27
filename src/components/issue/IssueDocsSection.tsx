"use client";

import {useState} from "react";
import Link from "next/link";
import {FileText, GitBranch, Plus} from "lucide-react";
import {useToast} from "@/components/ui/Toast";
import {useDeriveIssueDoc, useEnsureIssueMainDoc, useIssueDocs} from "@/hooks/useCiraDocs";
import {docsError} from "@/lib/docs/error";
import type {DocRule} from "@/types/ciraDocs";
import type {LineageNode} from "@/types/docs";
import Button from "@/components/ui/Button";

/** 만들 파생 문서: 슬롯(rule) 또는 자유(folderName 직접 입력) */
type Draft = { rule: DocRule | null; title: string; folderName: string };

/**
 * Task 상세 › 연결 문서 & 계보: 메인 Docs 노트, 기준정보 슬롯 버튼(+ draft …, + 자유 문서), 이 Task 에서 뻗어 나간 계보.
 * 메인 노트가 없는 (배포 전) Task 는 [Docs 문서 생성] 버튼만.
 */
export function IssueDocsSection({projectId, issueId}: { projectId: string; issueId: string }) {
    const {data, isLoading, isError} = useIssueDocs(projectId, issueId);
    const ensure = useEnsureIssueMainDoc(projectId, issueId);
    const derive = useDeriveIssueDoc(projectId, issueId);
    const {show, ToastComponent} = useToast();
    const [draft, setDraft] = useState<Draft | null>(null);

    const submit = () => {
        if (!draft || !draft.title.trim()) return;
        derive.mutate({title: draft.title.trim(), ruleId: draft.rule?.id ?? null, folderName: draft.rule ? null : draft.folderName.trim() || null}, {
            onSuccess: () => setDraft(null),
            onError: (e) => show(docsError(e, "문서를 만들지 못했습니다."), "error"),
        });
    };

    return (
        <section aria-label="연결 문서 & 계보">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4"/> 연결 문서 & 계보
            </h3>
            {isLoading ? <p className="text-xs text-slate-400">불러오는 중…</p> : isError || !data ? (
                <p className="text-xs text-slate-400">연결 문서를 불러오지 못했습니다.</p>
            ) : !data.main ? (
                <Button variant="unstyled" type="button" disabled={ensure.isPending}
                        onClick={() => ensure.mutate(undefined, {onError: (e) => show(docsError(e, "문서를 만들지 못했습니다."), "error")})}
                        className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Docs 문서 생성
                </Button>
            ) : (
                <div className="space-y-3 text-sm">
                    <Link href={`/docs/${data.main.noteId}`}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-800 hover:bg-slate-50">
                        <FileText className="h-4 w-4 shrink-0 text-blue-500"/>
                        <span className="truncate">{data.main.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-400">메인 문서</span>
                    </Link>

                    <div className="flex flex-wrap gap-1.5">
                        {data.rules.map((r) => (
                            <Button variant="unstyled" key={r.id} type="button" onClick={() => setDraft({rule: r, title: "", folderName: ""})}
                                    className="flex h-7 items-center gap-1 rounded-full border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50">
                                <Plus className="h-3 w-3"/>{r.folderName}
                            </Button>
                        ))}
                        <Button variant="unstyled" type="button" onClick={() => setDraft({rule: null, title: "", folderName: ""})}
                                className="flex h-7 items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 text-xs text-slate-600 hover:bg-slate-50">
                            <Plus className="h-3 w-3"/>자유 문서
                        </Button>
                    </div>

                    {draft && (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2">
                            <span className="text-xs text-slate-500">{draft.rule ? `${draft.rule.folderName} /` : "폴더"}</span>
                            {!draft.rule && (
                                <input value={draft.folderName} onChange={(e) => setDraft({...draft, folderName: e.target.value})}
                                       placeholder="(선택) 예: retro" aria-label="폴더 이름"
                                       className="h-8 w-28 rounded border border-slate-200 px-2 text-sm"/>
                            )}
                            <input autoFocus value={draft.title} onChange={(e) => setDraft({...draft, title: e.target.value})}
                                   placeholder="문서 제목" aria-label="문서 제목"
                                   className="h-8 min-w-0 flex-1 rounded border border-slate-200 px-2 text-sm"/>
                            <Button variant="unstyled" type="submit" disabled={!draft.title.trim() || derive.isPending}
                                    className="h-8 rounded bg-d94-brand px-3 text-xs font-medium text-white hover:bg-d94-brand-hover disabled:opacity-50">만들기</Button>
                            <Button variant="unstyled" type="button" onClick={() => setDraft(null)} className="h-8 rounded px-2 text-xs text-slate-500 hover:bg-slate-100">취소</Button>
                        </form>
                    )}

                    {data.lineage.length > 1 && (
                        <div>
                            <p className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500"><GitBranch className="h-3.5 w-3.5"/> 계보</p>
                            <LineageTree nodes={data.lineage}/>
                        </div>
                    )}
                </div>
            )}
            {ToastComponent}
        </section>
    );
}

/** origin(제목) 으로 이은 들여쓴 트리 */
function LineageTree({nodes}: { nodes: LineageNode[] }) {
    const rows: { n: LineageNode; depth: number }[] = [];
    const walk = (origin: string | null, depth: number) =>
        nodes.filter((n) => n.origin === origin).sort((a, b) => a.title.localeCompare(b.title)).forEach((n) => {
            rows.push({n, depth});
            if (depth < 20) walk(n.title, depth + 1);
        });
    walk(null, 0);
    return (
        <ul className="text-sm">
            {rows.map(({n, depth}) => (
                // 들여쓰기 깊이는 동적 수치라 인라인 style
                <li key={n.id} style={{paddingLeft: `${depth * 14}px`}}>
                    <Link href={`/docs/${n.id}`} className="block truncate rounded px-1 py-0.5 text-slate-700 hover:bg-slate-100">
                        {depth > 0 && <span className="text-slate-300">└ </span>}{n.title}
                        {n.stream && <span className="ml-1 text-xs text-slate-400">· {n.stream}</span>}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
