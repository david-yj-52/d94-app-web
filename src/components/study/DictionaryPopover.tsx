"use client";
import {useEffect} from "react";
import axios from "axios";
import {createPortal} from "react-dom";
import {useDictionary} from "@/hooks/useStudy";
import {errorMessage} from "@/lib/study/colors";
import Button from "@/components/ui/Button";

interface Props { word: string; rect: DOMRect; onKeepOpen: () => void; onClose: () => void; onSaveTerm: (term: string, definition: string) => void; onRegisterKey: () => void }
export default function DictionaryPopover({word, rect, onKeepOpen, onClose, onSaveTerm, onRegisterKey}: Props) {
    const query = useDictionary(word);
    useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [onClose]);
    const keyError = axios.isAxiosError(query.error) && ["STUDY_DICTIONARY_KEY_REQUIRED", "STUDY_DICTIONARY_KEY_INVALID"].includes(query.error.response?.data?.code);
    const top = rect.bottom + 6 + 190 > innerHeight ? Math.max(8, rect.top - 196) : rect.bottom + 6;
    return createPortal(<div role="dialog" onMouseEnter={onKeepOpen} onMouseLeave={onClose} style={{position:"fixed",left:Math.min(rect.left, innerWidth-330),top,zIndex:1000}}
        className="w-80 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-xl">
        {query.isLoading ? <p>찾는 중…</p> : query.isError ? <>
            <p>{keyError ? "사전 키를 등록하면 뜻을 볼 수 있어요" : errorMessage(query.error, "뜻을 불러오지 못했습니다")}</p>
            {keyError && <Button variant="unstyled" onClick={onRegisterKey} className="mt-2 text-indigo-600">키 등록</Button>}</> : query.data?.status === "NOT_FOUND" ? <><p>사전에 없는 단어입니다</p>{query.data.suggestions.slice(0,5).map((s) => <span key={s} className="mr-2 text-slate-500">{s}</span>)}</> : <>
            {query.data?.entries.map((entry) => <section key={`${entry.headword}-${entry.pos}`} className="mb-2"><p><b>{entry.headword}</b> <span className="text-slate-500">{entry.pos}</span></p><ol className="list-decimal pl-5">{entry.senses.slice(0,3).map((sense,i)=><li key={i}>{sense.definition}{sense.example && <p className="italic text-slate-500">{sense.example}</p>}</li>)}</ol></section>)}
            {query.data?.entries[0]?.senses[0] && <Button variant="unstyled" onClick={() => onSaveTerm(query.data!.entries[0].headword, query.data!.entries[0].senses[0].definition)} className="text-indigo-600">단어장에 저장</Button>}
        </>}
        <a className="float-right text-xs text-slate-500" href={`https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`} target="_blank" rel="noreferrer">Merriam-Webster</a>
    </div>, document.body);
}
