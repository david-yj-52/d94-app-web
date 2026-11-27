"use client";

import {useToast} from "@/components/ui/Toast";
import {useDocRules, useIssueTypes, useSaveDocRules} from "@/hooks/useCiraDocs";
import {docsError} from "@/lib/docs/error";
import type {DocRule} from "@/types/ciraDocs";
import type {NoteKind} from "@/types/docs";
import {ArrowDown, ArrowUp} from "lucide-react";
import {use, useEffect, useState} from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

const KINDS: NoteKind[] = ["idea", "doc", "task", "knowledge"];
const blank = (): DocRule => ({id: null, issueTypeId: null, folderName: "", sortOrder: null, defaultKind: null,
    defaultStream: null, templateContent: null, autoCreate: false});

/**
 * 프로젝트 설정 › 문서 관리: Task 타입별 파생 문서 폴더 슬롯(task/{프로젝트}/{Task}/{폴더}).
 * 타입을 고르고 슬롯을 편집한 뒤 [저장] 하면 그 타입 목록을 통째로 바꾼다(프로젝트 ADMIN).
 */
export default function ProjectDocRulesPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const {data: types = []} = useIssueTypes();
    const {data: rules = []} = useDocRules(projectId);
    const save = useSaveDocRules(projectId);
    const {show, ToastComponent} = useToast();
    const [typeId, setTypeId] = useState<string>("");
    const [rows, setRows] = useState<DocRule[]>([]);

    const current = typeId || types[0]?.id || "";
    // 타입을 바꾸거나 저장 결과가 오면 서버 값으로 편집 목록을 다시 채운다
    useEffect(() => setRows(rules.filter((r) => r.issueTypeId === current)), [rules, current]);

    const set = (i: number, patch: Partial<DocRule>) => setRows((rs) => rs.map((r, j) => (j === i ? {...r, ...patch} : r)));
    const move = (i: number, d: -1 | 1) => setRows((rs) => {
        const next = [...rs];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        return next;
    });
    const submit = () => save.mutate(
        {issueTypeId: current, rules: rows.map((r, i) => ({...r, sortOrder: i}))},
        {onSuccess: () => show("저장했습니다."), onError: (e) => show(docsError(e, "저장하지 못했습니다."), "error")},
    );

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">문서 관리</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Task가 만들어지면 팀 Docs의 <code className="rounded bg-slate-100 px-1">task/프로젝트키/Task키</code>에 메인 문서가 생깁니다.
                    Task 타입별로 파생 문서를 담을 하위 폴더를 정하세요. 목록에 없는 폴더로도 파생할 수 있습니다.
                </p>
            </div>

            <section className="max-w-3xl">
                <div className="mb-3 flex items-center gap-2">
                    <label htmlFor="docRuleType" className="text-sm text-slate-600">Task 타입</label>
                    <select id="docRuleType" value={current} onChange={(e) => setTypeId(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                        {types.map((t) => <option key={t.id} value={t.id}>{t.typeNm}</option>)}
                    </select>
                </div>

                {rows.length === 0 && <EmptyState size="sm" className="mb-3 p-0 text-left">슬롯이 없습니다. 파생 문서는 메인 문서와 같은 폴더(또는 직접 입력한 폴더)에 만들어집니다.</EmptyState>}
                <ul className="mb-3 space-y-2">
                    {rows.map((r, i) => (
                        <li key={r.id ?? `new-${i}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <input value={r.folderName} onChange={(e) => set(i, {folderName: e.target.value})} placeholder="폴더 이름 (예: plan)"
                                       aria-label="폴더 이름" className="h-9 w-40 rounded-lg border border-slate-200 px-2"/>
                                <select value={r.defaultKind ?? ""} onChange={(e) => set(i, {defaultKind: (e.target.value || null) as NoteKind | null})}
                                        aria-label="기본 종류" className="h-9 rounded-lg border border-slate-200 bg-white px-2">
                                    <option value="">종류: doc</option>
                                    {KINDS.map((k) => <option key={k} value={k}>종류: {k}</option>)}
                                </select>
                                <input value={r.defaultStream ?? ""} onChange={(e) => set(i, {defaultStream: e.target.value || null})} placeholder="트랙 (선택)"
                                       aria-label="기본 트랙" className="h-9 w-28 rounded-lg border border-slate-200 px-2"/>
                                <label className="flex items-center gap-1 text-xs text-slate-600">
                                    <input type="checkbox" checked={r.autoCreate} onChange={(e) => set(i, {autoCreate: e.target.checked})}/>
                                    Task 생성 때 폴더 만들기
                                </label>
                                <span className="ml-auto flex gap-1">
                                    <Button variant="unstyled" type="button" aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)}
                                            className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4"/></Button>
                                    <Button variant="unstyled" type="button" aria-label="아래로" disabled={i === rows.length - 1} onClick={() => move(i, 1)}
                                            className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4"/></Button>
                                    <Button variant="unstyled" type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                                            className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</Button>
                                </span>
                            </div>
                            <textarea value={r.templateContent ?? ""} onChange={(e) => set(i, {templateContent: e.target.value || null})}
                                      placeholder="Markdown 템플릿 (선택) — 파생 문서 본문에 들어갑니다" aria-label="템플릿" rows={2}
                                      className="mt-2 w-full rounded-lg border border-slate-200 p-2 font-mono text-xs"/>
                        </li>
                    ))}
                </ul>
                <div className="flex gap-2">
                    <Button variant="unstyled" type="button" onClick={() => setRows((rs) => [...rs, blank()])}
                            className="h-10 rounded-lg border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50">+ 슬롯 추가</Button>
                    <Button type="button" onClick={submit} disabled={!current || save.isPending || rows.some((r) => !r.folderName.trim())}
                            className="font-medium">저장</Button>
                </div>
            </section>
            {ToastComponent}
        </>
    );
}
