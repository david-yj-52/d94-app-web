"use client";
import {useState} from "react";
import {useDeleteDictionaryKey, useDictionaryKey, useSaveDictionaryKey} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";

/** 사전(Merriam-Webster) API 키 등록·삭제. 키는 계정별 — 관리자 권한 불필요. 학습 뷰어 모달과 기준정보 Study 그룹이 같이 쓴다 */
export default function DictionaryKeyForm({onSaved, onError}: {
    onSaved?: (message: string) => void;
    onError?: (message: string) => void;
}) {
    const [key, setKey] = useState("");
    const [error, setError] = useState("");
    const status = useDictionaryKey(), save = useSaveDictionaryKey(), remove = useDeleteDictionaryKey();
    const fail = (e: unknown, fallback: string) => {
        const m = errorMessage(e, fallback);
        setError(m);
        onError?.(m);
    };
    return <div>
        <p className="mb-2 text-sm text-slate-600">키는 계정별로 암호화해 저장합니다.{" "}
            <a className="text-indigo-600 underline" href="https://dictionaryapi.com/" target="_blank" rel="noreferrer">Merriam-Webster에서 발급</a>
            {" "}(Learner&apos;s 또는 Collegiate)</p>
        {status.data?.registered
            ? <p className="mb-3 text-sm">등록됨 · {status.data.reference}
                <button type="button" disabled={remove.isPending} className="ml-2 text-red-600"
                        onClick={() => remove.mutate(undefined, {
                            onSuccess: () => onSaved?.("사전 키를 삭제했습니다"),
                            onError: (e) => fail(e, "키를 삭제하지 못했습니다"),
                        })}>삭제</button></p>
            : status.isSuccess && <p className="mb-3 text-sm text-slate-500">등록된 키가 없습니다.</p>}
        <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)}
               className="w-full rounded border p-2" aria-label="API 키" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
            <button type="button" disabled={!key.trim() || save.isPending}
                    onClick={() => save.mutate(key.trim(), {
                        onSuccess: () => {
                            setKey("");
                            setError("");
                            onSaved?.("사전 키를 저장했습니다");
                        },
                        onError: (e) => fail(e, "키를 등록하지 못했습니다"),
                    })}
                    className="rounded bg-indigo-600 px-3 py-1 text-white disabled:opacity-50">
                {save.isPending ? "확인 중…" : "저장"}
            </button>
        </div>
    </div>;
}
