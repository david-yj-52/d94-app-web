"use client";

import Dialog from "@/components/ui/Dialog";
import {ALWAYS_SHOWN_KEYS, type FieldDef} from "@/types/fields";
import {ArrowDown, ArrowUp, Settings2} from "lucide-react";
import {useState} from "react";
import Button from "@/components/ui/Button";

/**
 * Task 목록 컬럼 선택·순서. 바꿀 때마다 onChange(keys) — 부모가 바로 저장한다.
 * onChange(null) = [기본값으로]. onCreate·onImport = 새 컬럼 만들기·라이브러리에서 가져오기(부모가 창을 연다).
 * 프로젝트 필드 중 canEdit 인 것만 [수정]·[삭제].
 */
export default function ColumnPicker({fields, columns, onChange, onCreate, onImport, onEdit, onDelete}: {
    fields: FieldDef[];
    columns: string[];
    onChange: (keys: string[] | null) => void;
    onCreate?: () => void;
    onImport?: () => void;
    onEdit?: (f: FieldDef) => void;
    onDelete?: (f: FieldDef) => void;
}) {
    const [open, setOpen] = useState(false);
    const byKey = new Map(fields.map((f) => [f.fieldKey, f]));
    const shown = columns.filter((k) => byKey.has(k));
    const hidden = fields.filter((f) => !shown.includes(f.fieldKey));

    const move = (i: number, d: -1 | 1) => {
        const next = [...shown];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
    };
    const row = (f: FieldDef, checked: boolean, i?: number) => (
        <li key={f.fieldKey} className="flex min-h-10 items-center gap-2 px-4">
            <label className="flex flex-1 items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={ALWAYS_SHOWN_KEYS.includes(f.fieldKey)}
                    onChange={() => onChange(checked ? shown.filter((k) => k !== f.fieldKey) : [...shown, f.fieldKey])}
                />
                {f.name}
                {f.kind === "cf" && <span className="text-[11px] text-slate-400">사용자 정의</span>}
            </label>
            {f.canEdit && onEdit && (
                <Button variant="unstyled" type="button" aria-label={`${f.name} 수정`} onClick={() => { setOpen(false); onEdit(f); }}
                        className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</Button>
            )}
            {f.canEdit && onDelete && (
                <Button variant="unstyled" type="button" aria-label={`${f.name} 삭제`} onClick={() => { setOpen(false); onDelete(f); }}
                        className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</Button>
            )}
            {i !== undefined && (
                <>
                    <Button variant="unstyled" type="button" aria-label={`${f.name} 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                        <ArrowUp className="h-4 w-4"/>
                    </Button>
                    <Button variant="unstyled" type="button" aria-label={`${f.name} 아래로`} disabled={i === shown.length - 1} onClick={() => move(i, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30">
                        <ArrowDown className="h-4 w-4"/>
                    </Button>
                </>
            )}
        </li>
    );

    return (
        <>
            <Button variant="unstyled" type="button" onClick={() => setOpen(true)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">
                <Settings2 className="h-4 w-4"/>컬럼
            </Button>
            <Dialog open={open} onOpenChange={setOpen} title="표시할 컬럼">
                <p className="px-4 pt-3 text-xs text-slate-500">바꾸면 바로 저장됩니다. 나에게만 적용됩니다.</p>
                <ul className="py-2">{shown.map((k, i) => row(byKey.get(k)!, true, i))}</ul>
                {hidden.length > 0 && (
                    <>
                        <p className="border-t border-slate-100 px-4 pt-3 text-xs font-semibold text-slate-500">숨긴 컬럼</p>
                        <ul className="py-2">{hidden.map((f) => row(f, false))}</ul>
                    </>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3">
                    {onCreate && (
                        <Button variant="unstyled" type="button" onClick={() => { setOpen(false); onCreate(); }}
                                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">+ 새 컬럼 만들기</Button>
                    )}
                    {onImport && (
                        <Button variant="unstyled" type="button" onClick={() => { setOpen(false); onImport(); }}
                                className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">+ 라이브러리에서 가져오기</Button>
                    )}
                    <span className="flex-1"/>
                    <Button type="button" onClick={() => onChange(null)}
                            variant="secondary" className="h-9 px-3">
                        기본값으로
                    </Button>
                </div>
            </Dialog>
        </>
    );
}
