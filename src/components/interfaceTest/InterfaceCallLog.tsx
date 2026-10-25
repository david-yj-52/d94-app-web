"use client";

import type {InterfaceCallResult} from "@/types/interfaceTest";
import MethodBadge from "./MethodBadge";

function statusClass(status: number): string {
    if (status >= 200 && status < 300) return "bg-emerald-50 text-emerald-700";
    if (status >= 300 && status < 400) return "bg-slate-100 text-slate-700";
    if (status >= 400 && status < 500) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-600";
}

/** 502·503·504 는 백엔드가 아니라 경로(UMD·Redis·집 PC) 문제 — UMD ui-guide §4-1 */
function statusNote(status: number): string | null {
    if (status === 0) return "응답 없음 (브라우저 → Next 서버 구간)";
    if (status === 502) return "인프라: 백엔드/UMD 연결 실패";
    if (status === 503) return "인프라: UMD local 미기동 또는 Redis 문제";
    if (status === 504) return "인프라: 응답 시간 초과";
    return null;
}

const toJson = (v: unknown) => JSON.stringify(v, null, 2);

interface Props {
    logs: InterfaceCallResult[];
    onClear: () => void;
}

export default function InterfaceCallLog({logs, onClear}: Props) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <h2 className="text-base font-bold text-slate-900">호출 기록 <span className="text-sm font-normal text-slate-500">({logs.length})</span></h2>
                <button type="button" onClick={onClear} disabled={logs.length === 0}
                        className="h-8 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    지우기
                </button>
            </div>

            {logs.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">버튼을 눌러 호출하면 결과가 여기에 쌓입니다.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {logs.map((log) => {
                        const note = statusNote(log.status);
                        return (
                            <li key={log.id} className="px-5 py-3">
                                <details>
                                    <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                                        <MethodBadge method={log.method}/>
                                        <span className="min-w-0 flex-1 truncate font-mono text-slate-700">{log.path}</span>
                                        <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${statusClass(log.status)}`}>
                                            {log.status || "ERR"}
                                        </span>
                                        <span className="w-16 text-right text-xs text-slate-500">{log.durationMs} ms</span>
                                    </summary>
                                    <div className="mt-3 space-y-2 text-xs">
                                        <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-slate-600">
                                            <dt className="text-slate-400">호출 시각</dt>
                                            <dd>{new Date(log.calledAt).toLocaleTimeString("ko-KR", {hour12: false})}</dd>
                                            <dt className="text-slate-400">X-Trace-Id</dt>
                                            <dd className="break-all font-mono">{log.traceId ?? "— (백엔드 직결이면 없음)"}</dd>
                                            {log.location && (
                                                <>
                                                    <dt className="text-slate-400">Location</dt>
                                                    <dd className="break-all font-mono">{log.location}</dd>
                                                </>
                                            )}
                                            {note && (
                                                <>
                                                    <dt className="text-slate-400">판단</dt>
                                                    <dd className="text-red-500">{note}</dd>
                                                </>
                                            )}
                                        </dl>
                                        {log.requestBody && (
                                            <div>
                                                <p className="mb-1 text-slate-400">요청 본문</p>
                                                <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-slate-700">{toJson(log.requestBody)}</pre>
                                            </div>
                                        )}
                                        <div>
                                            <p className="mb-1 text-slate-400">응답 본문</p>
                                            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-slate-700">
                                                {log.responseBody === undefined ? "(본문 없음)" : toJson(log.responseBody)}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
