"use client";

import {useState} from "react";
import Button from "@/components/ui/Button";

export interface DocsDialogSpec {
    title: string;
    message?: string;
    /** 있으면 한 줄 입력 (이름·제목), 없으면 확인만 */
    input?: { initial?: string; placeholder?: string };
    confirmLabel: string;
    danger?: boolean;
    onConfirm: (value: string) => void;
}

/** 이름 입력·삭제 확인 겸용 모달. 표준 모달 마크업(max-w-sm, 취소/주 버튼). 부모가 {spec && <DocsDialog …/>} 로 렌더링 */
export default function DocsDialog({spec, onClose}: { spec: DocsDialogSpec; onClose: () => void }) {
    const [value, setValue] = useState(spec.input?.initial ?? "");
    const submit = () => {
        if (spec.input && !value.trim()) return;
        onClose();
        spec.onConfirm(value.trim());
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <form className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                      e.preventDefault();
                      submit();
                  }}>
                <h2 className="text-base font-semibold text-slate-900">{spec.title}</h2>
                {spec.message && <p className="mt-2 text-sm text-slate-600">{spec.message}</p>}
                {spec.input && (
                    <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={spec.input.placeholder}
                           aria-label={spec.title} onKeyDown={(e) => e.key === "Escape" && onClose()}
                           className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                )}
                <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" onClick={onClose} variant="ghost">취소</Button>
                    <Button variant="unstyled" type="submit" autoFocus={!spec.input}
                            className={`h-10 rounded-lg px-4 text-sm font-medium text-white ${spec.danger ? "bg-red-500 hover:bg-red-600" : "bg-d94-brand hover:bg-d94-brand-hover"}`}>
                        {spec.confirmLabel}
                    </Button>
                </div>
            </form>
        </div>
    );
}
