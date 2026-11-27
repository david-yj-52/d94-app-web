"use client";

import {useCallback, useState} from "react";
import Button from "./Button";
import Dialog from "./Dialog";

type ConfirmOptions = { title?: string; confirmLabel?: string; danger?: boolean };
type Pending = { message: string; opts: ConfirmOptions; resolve: (ok: boolean) => void };

/**
 * 브라우저 confirm() 대체. useToast 처럼 훅 + 렌더링할 요소를 돌려준다.
 *   const {confirm, ConfirmComponent} = useConfirm();
 *   if (!(await confirm("삭제할까요?", {confirmLabel: "삭제", danger: true}))) return;
 *   return <>...{ConfirmComponent}</>;
 * 취소·바깥 클릭·Esc·✕ → false
 */
export function useConfirm() {
    const [pending, setPending] = useState<Pending | null>(null);

    const confirm = useCallback(
        (message: string, opts: ConfirmOptions = {}) => new Promise<boolean>((resolve) => setPending({message, opts, resolve})),
        [],
    );

    const settle = (ok: boolean) => {
        pending?.resolve(ok);
        setPending(null);
    };

    const ConfirmComponent = pending && (
        <Dialog open onOpenChange={(o) => !o && settle(false)} title={pending.opts.title ?? "확인"} compact>
            <p className="whitespace-pre-line px-4 py-4 text-sm text-slate-700">{pending.message}</p>
            <div className="flex gap-2 px-4 pb-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => settle(false)}>취소</Button>
                <Button type="button" variant={pending.opts.danger ? "danger" : "primary"} className="flex-1"
                        onClick={() => settle(true)}>
                    {pending.opts.confirmLabel ?? "확인"}
                </Button>
            </div>
        </Dialog>
    );

    return {confirm, ConfirmComponent};
}
