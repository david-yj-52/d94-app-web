"use client";

import {useToast} from "@/components/ui/Toast";
import {useDocRules, useIssueTypes, useSaveDocRules} from "@/hooks/useCiraDocs";
import {useCurrentSpace, useImportDocRules, useSaveSpaceDocRules, useSpaceDocRules} from "@/hooks/useSpaces";
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
 * 프로젝트 설정 › 문서 관리(산출물 규칙): Task 타입별 파생 문서 폴더 슬롯(task/{프로젝트}/{Task}/{폴더}).
 * V650 3단계: 기준정보 공통 규칙을 [기준정보에서 가져오기] 로 받으면 🔒 잠금(수정·삭제 불가),
 * 프로젝트 공통 슬롯(프로젝트 ADMIN), 작업 공간 슬롯(?space= 가 있으면, 프로젝트 ADMIN 또는 공간 관리자).
 * [저장] 은 그 범위·타입의 잠기지 않은 슬롯을 통째로 바꾼다.
 */
export default function ProjectDocRulesPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const {data: types = []} = useIssueTypes();
    const {space} = useCurrentSpace(projectId);
    // ?space= 로 기본 공간이 아닌 공간을 골랐으면 그 공간 슬롯을 편집한다
    const spaceMode = !!space && !space.isDefault;
    const {data: projectRules = []} = useDocRules(projectId);
    const {data: spaceRules = []} = useSpaceDocRules(spaceMode ? space.id : undefined);
    const rules = spaceMode ? spaceRules : projectRules;
    const saveProject = useSaveDocRules(projectId);
    const saveSpace = useSaveSpaceDocRules(space?.id ?? "");
    const save = spaceMode ? saveSpace : saveProject;
    const importRules = useImportDocRules(projectId);
    const {show, ToastComponent} = useToast();
    const [typeId, setTypeId] = useState<string>("");
    const [rows, setRows] = useState<DocRule[]>([]);

    const current = typeId || types[0]?.id || "";
    // 타입을 바꾸거나 저장 결과가 오면 서버 값으로 편집 목록을 다시 채운다
    // 편집 대상 = 이 범위의 잠기지 않은 슬롯. 나머지(잠금·상위 범위)는 읽기 전용으로 위에 보인다
    const editable = (r: DocRule) => !r.locked && (spaceMode ? r.scope === "SPACE" : r.scope !== "SPACE");
    const fixed = rules.filter((r) => r.issueTypeId === current && !editable(r));
    useEffect(() => setRows(rules.filter((r) => r.issueTypeId === current && editable(r))),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- editable 은 spaceMode 로만 바뀐다
        [rules, current, spaceMode]);

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
                <h2 className="text-xl font-bold text-slate-900">
                    문서 관리 {spaceMode ? `· 작업 공간 ${space.name}` : "· 프로젝트 공통"}
                </h2>
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
                    {!spaceMode && (
                        <Button variant="secondary" type="button" className="ml-auto" disabled={importRules.isPending}
                                onClick={() => importRules.mutate(undefined, {
                                    onSuccess: () => show("기준정보 공통 산출물 규칙을 가져왔습니다."),
                                    onError: (e) => show(docsError(e, "가져오지 못했습니다."), "error"),
                                })}>
                            기준정보에서 가져오기
                        </Button>
                    )}
                </div>

                {fixed.length > 0 && (
                    <ul className="mb-3 space-y-1" aria-label="잠긴 규칙">
                        {fixed.map((r) => (
                            <li key={r.id ?? r.folderName} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                <span aria-hidden>{r.locked ? "🔒" : "↑"}</span>
                                <span className="font-medium">{r.folderName}</span>
                                <span className="text-xs text-slate-400">
                                    {r.locked ? "기준정보 공통 규칙 — 프로젝트·공간에서 바꿀 수 없음" : "프로젝트 공통 규칙"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

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
