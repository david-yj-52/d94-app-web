"use client";

import {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {answerRequest} from "@/lib/api/ayaan";
import type {AyaanRequest} from "@/types/ayaan";
import {ayaanError, btnPrimary, btnSecondary, fmtTime, inputCls} from "../format";

const KIND_LABEL: Record<AyaanRequest["kind"], string> = {QUESTION: "질문", PERMISSION: "권한 요청", START: "개발 시작"};

/** 열린 요청 1건: 선택지 버튼 + (질문이면) 자유 답변. 이력은 아래 목록. 먼저 답한 1건만 유효(409). */
export default function RequestPanel({requests, onAnswered, onError}: {
    requests: AyaanRequest[];
    onAnswered: () => void;
    onError: (msg: string) => void;
}) {
    const [text, setText] = useState("");
    const open = requests.find((r) => r.status === "OPEN");
    const answer = useMutation({
        mutationFn: (body: { choice?: number; answer?: string }) => answerRequest(open!.id, body),
        onSuccess: () => { setText(""); onAnswered(); },
        onError: (e: any) => {
            onError(e?.response?.status === 409 ? "이미 처리된 요청입니다." : ayaanError(e, "응답에 실패했습니다."));
            onAnswered();
        },
    });
    if (!requests.length) return null;
    return (
        <section aria-label="사람 응답 요청" className="space-y-3 rounded-2xl border border-violet-200 bg-white p-5">
            {open && (
                <div className="space-y-2">
                    <h2 className="font-bold text-violet-700">{KIND_LABEL[open.kind]} — 응답 대기</h2>
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{open.question}</p>
                    {open.context && <p className="text-xs text-slate-500">배경: {open.context}</p>}
                    <div className="flex flex-wrap gap-2">
                        {open.options.map((o, i) => (
                            <button key={o} className={i === (open.recommend ?? 0) ? btnPrimary : btnSecondary}
                                    disabled={answer.isPending} onClick={() => answer.mutate({choice: i})}>
                                {o}{open.recommend === i ? " (추천)" : ""}
                            </button>
                        ))}
                    </div>
                    {open.kind === "QUESTION" && (
                        <div className="flex gap-2">
                            <input aria-label="자유 답변" className={inputCls} value={text} onChange={(e) => setText(e.target.value)}
                                   placeholder="직접 답변 입력"/>
                            <button className={btnSecondary} disabled={answer.isPending || !text.trim()}
                                    onClick={() => answer.mutate({answer: text.trim()})}>답변</button>
                        </div>
                    )}
                </div>
            )}
            <ul className="space-y-1 text-xs text-slate-500">
                {requests.filter((r) => r !== open).map((r) => (
                    <li key={r.id}>
                        [{KIND_LABEL[r.kind]}] {r.question} → <b>{r.answer ?? r.status}</b>
                        {r.answeredBy ? ` · ${r.answeredBy} ${fmtTime(r.answeredAt)}` : ""}
                    </li>
                ))}
            </ul>
        </section>
    );
}
