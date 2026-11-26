"use client";

import {useRef, useState} from "react";
import {insertRef, refQueryAt} from "./formulaRef";

const HINT = "사칙연산 · 괄호 · now() · daysBetween(a, b) · sum|avg|count(로그키[, 최근N일]) · @지표코드";

/** 수식 입력. `@` 를 치면 내 지표 코드를 제안한다(클릭 또는 Enter 로 넣기) */
export default function FormulaEditor({value, onChange, codes}: {
    value: string;
    onChange: (v: string) => void;
    codes: string[];
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [caret, setCaret] = useState(0);
    const q = refQueryAt(value, caret);
    const suggestions = q == null ? [] : codes.filter((c) => c.startsWith(q)).slice(0, 8);

    const pick = (code: string) => {
        const next = insertRef(value, caret, code);
        onChange(next.text);
        setCaret(next.caret);
        requestAnimationFrame(() => ref.current?.setSelectionRange(next.caret, next.caret));
    };

    return (
        <div className="relative">
            <textarea ref={ref} value={value} rows={3} aria-label="수식" spellCheck={false}
                      onChange={(e) => {
                          onChange(e.target.value);
                          setCaret(e.target.selectionStart);
                      }}
                      onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
                      onKeyDown={(e) => {
                          if (e.key === "Enter" && suggestions.length > 0) {
                              e.preventDefault();
                              pick(suggestions[0]);
                          }
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
            {suggestions.length > 0 && (
                <ul role="listbox" aria-label="지표 코드 제안"
                    className="absolute z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    {suggestions.map((c) => (
                        <li key={c}>
                            <button type="button" role="option" aria-selected={false}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        pick(c);
                                    }}
                                    className="w-full px-3 py-1.5 text-left font-mono text-sm text-slate-700 hover:bg-slate-50">
                                @{c}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <p className="mt-1 text-xs text-slate-500">{HINT}</p>
        </div>
    );
}
