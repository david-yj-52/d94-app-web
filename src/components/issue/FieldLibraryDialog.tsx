"use client";

import Dialog from "@/components/ui/Dialog";
import {CUSTOM_FIELD_TYPE_LABELS, type LibraryItem} from "@/types/fields";

const GROUPS = [["global", "전역 필드"], ["type", "이 타입의 필드"]] as const;

/**
 * 가져올 수 있는 전역·타입 필드 목록. [가져오기] → onImport(원본 id). 가져가면 이 프로젝트의 복사본이 생긴다.
 * 이미 가져온 항목(importedAs)은 "가져옴"으로 비활성.
 */
export default function FieldLibraryDialog({items, onImport, isPending, onClose}: {
    items: LibraryItem[];
    onImport: (sourceFieldId: string) => void;
    isPending?: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title="라이브러리에서 가져오기">
            <p className="px-4 pt-3 text-xs text-slate-500">가져오면 이 프로젝트의 필드로 복사됩니다. 복사본은 원본과 따로 고칠 수 있습니다.</p>
            {items.length === 0 && <p className="px-4 py-6 text-sm text-slate-400">가져올 수 있는 필드가 없습니다.</p>}
            {GROUPS.map(([scope, title]) => {
                const group = items.filter((i) => i.field.scope === scope);
                if (group.length === 0) return null;
                return (
                    <section key={scope} className="py-2">
                        <h3 className="px-4 pb-1 text-xs font-semibold text-slate-500">{title}</h3>
                        <ul>
                            {group.map(({field, importedAs}) => (
                                <li key={field.fieldKey} aria-label={field.name} className="flex min-h-11 items-center gap-2 px-4 text-sm">
                                    <span className="flex-1">
                                        {field.name}
                                        <span className="ml-2 text-xs text-slate-400">{CUSTOM_FIELD_TYPE_LABELS[field.fieldType]}</span>
                                    </span>
                                    <button
                                        type="button"
                                        disabled={!!importedAs || isPending}
                                        onClick={() => onImport(field.fieldKey.slice(3))}
                                        className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {importedAs ? "가져옴" : "가져오기"}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}
        </Dialog>
    );
}
