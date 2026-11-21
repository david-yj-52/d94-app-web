"use client";
import DictionaryKeyForm from "./DictionaryKeyForm";

export default function DictionaryKeyModal({onClose, onSaved}: {onClose: () => void; onSaved?: (message: string) => void}) {
    return <div className="fixed inset-0 z-[1100] grid place-items-center bg-black/30" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}>
        <section role="dialog" aria-modal="true" aria-label="사전 API 키" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">사전 API 키</h2><button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">닫기</button></div>
            <DictionaryKeyForm onSaved={(m)=>{onSaved?.(m);if(m.includes("저장"))onClose();}}/>
        </section>
    </div>;
}
