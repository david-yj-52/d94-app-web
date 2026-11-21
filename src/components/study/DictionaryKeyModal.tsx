"use client";
import {useState} from "react";
import {useDeleteDictionaryKey, useDictionaryKey, useSaveDictionaryKey} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";

export default function DictionaryKeyModal({onClose, onSaved}: {onClose: () => void; onSaved?: (message: string) => void}) {
    const [key, setKey] = useState(""); const [error, setError] = useState("");
    const status = useDictionaryKey(), save = useSaveDictionaryKey(), remove = useDeleteDictionaryKey();
    return <div className="fixed inset-0 z-[1100] grid place-items-center bg-black/30" role="presentation" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}}>
        <section role="dialog" aria-modal="true" aria-label="사전 API 키" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold">사전 API 키</h2><p className="my-2 text-sm">키는 계정별로 암호화해 저장합니다. <a className="text-indigo-600 underline" href="https://dictionaryapi.com/" target="_blank" rel="noreferrer">Merriam-Webster에서 발급</a></p>
            {status.data?.registered && <p className="mb-3 text-sm">등록됨 · {status.data.reference} <button onClick={()=>remove.mutate(undefined,{onSuccess:()=>onSaved?.("사전 키를 삭제했습니다")})} className="ml-2 text-red-600">삭제</button></p>}
            <input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} className="w-full rounded border p-2" aria-label="API 키" />
            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded border px-3 py-1">닫기</button><button disabled={!key || save.isPending} onClick={()=>save.mutate(key,{onSuccess:()=>{onSaved?.("사전 키를 저장했습니다");onClose();},onError:(e)=>setError(errorMessage(e,"키를 등록하지 못했습니다"))})} className="rounded bg-indigo-600 px-3 py-1 text-white">저장</button></div>
        </section>
    </div>;
}
