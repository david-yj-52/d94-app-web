"use client";

import {useState} from "react";
import {isAxiosError} from "axios";
import {Copy, KeyRound, Trash2} from "lucide-react";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {
    useApiTokens,
    useApiTokenServices,
    useIssueApiToken,
    useRevokeApiToken,
    useSetApiTokenService,
} from "@/hooks/useApiTokens";
import {GLOBAL_TOKEN_SERVICE, serviceLabel} from "@/types/apiToken";
import type {ApiTokenAccess, IssuedApiToken, IssueApiTokenRequest} from "@/types/apiToken";

const NAME_MAX = 100;
const DAYS = [30, 90, 365] as const;
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand disabled:opacity-60";
const cardCls = "rounded-xl border border-slate-200 bg-white p-6";

const errorMessage = (e: unknown, fallback: string) =>
    (isAxiosError(e) && e.response?.data?.message) || fallback;

/** 백엔드 LocalDateTime("2026-11-20T10:00:00") → 표시용. ponytail: 시간대 변환 없음 — 서버 시각 그대로 */
const day = (s: string) => s.slice(0, 10);
const minute = (s: string) => s.slice(0, 16).replace("T", " ");

/** API 토큰 그룹: 서비스별 허용(ADMIN 변경) + 내 토큰 발급·폐기 (MCP·AI 도구용) */
export default function ApiTokenSettingsPanel({isAdmin}: { isAdmin: boolean }) {
    const {show, ToastComponent} = useToast();
    return (
        <>
            <ServicesCard isAdmin={isAdmin} onError={(m) => show(m, "error")}/>
            <TokensCard onToast={show}/>
            {ToastComponent}
        </>
    );
}

function ServicesCard({isAdmin, onError}: { isAdmin: boolean; onError: (m: string) => void }) {
    const {data} = useApiTokenServices();
    const toggle = useSetApiTokenService();
    if (!data) return <SkeletonCard/>;

    return (
        <section className={cardCls}>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">서비스별 허용</h3>
            <p className="mb-4 text-xs text-slate-500">끄면 그 서비스의 토큰 발급과 호출이 모두 막힙니다(이미 발급된 토큰 포함). 서비스를 끄면 전역 토큰도 그 서비스는 호출할 수 없습니다.</p>
            {!isAdmin && <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">관리자만 변경할 수 있습니다.</p>}
            <ul className="divide-y divide-slate-100">
                {data.map((s) => (
                    <li key={s.service} className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-slate-700">{serviceLabel(s.service)}</span>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={s.enabled} disabled={!isAdmin || toggle.isPending}
                                   aria-label={`${s.service} API 토큰 허용`}
                                   onChange={(e) => toggle.mutate({service: s.service, enabled: e.target.checked},
                                       {onError: (err) => onError(errorMessage(err, "변경하지 못했습니다"))})}/>
                            {s.enabled ? "허용" : "차단"}
                        </label>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function TokensCard({onToast}: { onToast: (m: string, type?: "success" | "error") => void }) {
    const services = useApiTokenServices().data?.filter((s) => s.enabled) ?? [];
    const {data: tokens} = useApiTokens();
    const issue = useIssueApiToken();
    const revoke = useRevokeApiToken();
    const [form, setForm] = useState<Omit<IssueApiTokenRequest, "service"> & { service: string }>(
        {service: "", name: "", access: "READ", expiresInDays: 90});
    const [issued, setIssued] = useState<IssuedApiToken | null>(null);

    // 기본 선택은 서비스 토큰 — 전역 토큰은 직접 골라야 한다
    const service = form.service
        || (services.find((s) => s.service !== GLOBAL_TOKEN_SERVICE) ?? services[0])?.service || "";
    const name = form.name.trim();
    const canIssue = !!service && name.length > 0 && name.length <= NAME_MAX && !issue.isPending;

    const submit = () => issue.mutate({...form, service, name}, {
        onSuccess: (res) => {
            setIssued(res);
            setForm((f) => ({...f, name: ""}));
        },
        onError: (e) => onToast(errorMessage(e, "발급하지 못했습니다"), "error"),
    });

    const remove = (id: string, label: string) => {
        if (!window.confirm(`'${label}' 토큰을 폐기할까요? 이 토큰을 쓰는 도구는 바로 호출이 막힙니다.`)) return;
        revoke.mutate(id, {
            onSuccess: () => onToast("폐기했습니다"),
            onError: (e) => onToast(errorMessage(e, "폐기하지 못했습니다"), "error"),
        });
    };

    const copy = (text: string) => navigator.clipboard.writeText(text)
        .then(() => onToast("복사했습니다"), () => onToast("복사하지 못했습니다. 직접 선택해 복사하세요", "error"));

    return (
        <section className={cardCls}>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">내 API 토큰</h3>
            <p className="mb-4 text-xs text-slate-500">
                MCP 서버 등 AI 도구가 내 계정 권한으로 API 를 호출할 때 씁니다. 읽기 전용은 조회(GET)만 할 수 있습니다.
            </p>

            {issued && (
                <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4" role="alert">
                    <p className="mb-2 text-sm font-semibold text-amber-900">토큰이 발급됐습니다. 지금만 볼 수 있으니 복사해 두세요.</p>
                    <div className="flex gap-2">
                        <code className="min-w-0 flex-1 break-all rounded bg-white px-3 py-2 text-xs text-slate-800"
                              aria-label="발급된 토큰">{issued.token}</code>
                        <button type="button" onClick={() => copy(issued.token)}
                                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">
                            <Copy className="h-4 w-4"/> 복사
                        </button>
                    </div>
                    <p className="mt-3 text-xs text-amber-900">
                        MCP 설정 예시 (Claude Code · Cursor · Codex 등, Streamable HTTP). DOCS·CIRA 를 함께 쓰려면 전체(전역) 토큰:
                    </p>
                    <pre className="mt-1 overflow-x-auto rounded bg-white px-3 py-2 text-xs text-slate-700">{
                        mcpConfigExample(issued.token)
                    }</pre>
                    <p className="mt-1 text-xs text-amber-900">새 토큰은 서버 반영까지 최대 1시간 걸릴 수 있습니다.</p>
                    <div className="mt-3 flex justify-end">
                        <button type="button" onClick={() => setIssued(null)}
                                className="h-9 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700">
                            확인했습니다
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-2 md:grid-cols-[1fr_8rem_9rem_7rem_auto]">
                <input className={inputCls} aria-label="토큰 이름" placeholder="예: 노트북 claude-code" maxLength={NAME_MAX}
                       value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                       onKeyDown={(e) => { if (e.key === "Enter" && canIssue) submit(); }}/>
                <select className={inputCls} aria-label="서비스" value={service}
                        onChange={(e) => setForm({...form, service: e.target.value})}>
                    {services.length === 0 && <option value="">허용된 서비스 없음</option>}
                    {services.map((s) => <option key={s.service} value={s.service}>{serviceLabel(s.service)}</option>)}
                </select>
                <select className={inputCls} aria-label="권한" value={form.access}
                        onChange={(e) => setForm({...form, access: e.target.value as ApiTokenAccess})}>
                    <option value="READ">읽기 전용</option>
                    <option value="WRITE">읽기·쓰기</option>
                </select>
                <select className={inputCls} aria-label="만료" value={form.expiresInDays}
                        onChange={(e) => setForm({...form, expiresInDays: Number(e.target.value) as 30 | 90 | 365})}>
                    {DAYS.map((d) => <option key={d} value={d}>{d}일</option>)}
                </select>
                <button type="button" onClick={submit} disabled={!canIssue}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-d94-brand px-4 text-sm font-semibold text-white hover:bg-d94-brand-hover disabled:opacity-60">
                    <KeyRound className="h-4 w-4"/> 발급
                </button>
            </div>

            {service === GLOBAL_TOKEN_SERVICE && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800" role="note">
                    전역 토큰은 모든 서비스(CIRA·Docs·Study 등)의 API 를 내 권한으로 호출합니다. 유출되면 피해 범위가 크니 꼭 필요할 때만 쓰고, 가능하면 읽기 전용으로 발급하세요.
                </p>
            )}

            <div className="mt-5 overflow-x-auto">
                {!tokens ? <SkeletonCard/> : tokens.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">발급한 토큰이 없습니다.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-slate-500">
                        <tr>
                            <th className="py-2 font-medium">이름</th>
                            <th className="py-2 font-medium">서비스</th>
                            <th className="py-2 font-medium">권한</th>
                            <th className="py-2 font-medium">토큰</th>
                            <th className="py-2 font-medium">만료</th>
                            <th className="py-2 font-medium">마지막 사용</th>
                            <th className="py-2"/>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {tokens.map((t) => {
                            const expired = new Date(t.expiresAt) <= new Date();
                            return (
                                <tr key={t.id} className={expired ? "text-slate-400" : "text-slate-700"}>
                                    <td className="py-2 pr-2">{t.name}</td>
                                    <td className="py-2 pr-2">{serviceLabel(t.service)}</td>
                                    <td className="py-2 pr-2">{t.access === "WRITE" ? "읽기·쓰기" : "읽기 전용"}</td>
                                    <td className="py-2 pr-2 font-mono text-xs">{t.prefix}…</td>
                                    <td className="py-2 pr-2">{expired ? <span className="text-red-500">만료됨</span> : day(t.expiresAt)}</td>
                                    <td className="py-2 pr-2">{t.lastUsedAt ? minute(t.lastUsedAt) : "-"}</td>
                                    <td className="py-2 text-right">
                                        <button type="button" aria-label={`${t.name} 폐기`} onClick={() => remove(t.id, t.name)}
                                                disabled={revoke.isPending}
                                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                                            <Trash2 className="h-4 w-4"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

/** UMD 경유 MCP 엔드포인트. NEXT_PUBLIC_MCP_URL 없으면 자리표시자 */
export const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || "https://{UMD_HOST}/mcp";

function mcpConfigExample(token: string): string {
    return JSON.stringify({
        mcpServers: {d94: {type: "http", url: MCP_URL, headers: {Authorization: `Bearer ${token}`}}},
    }, null, 2) + `\n\n# Claude Code\nclaude mcp add --transport http d94 ${MCP_URL} --header "Authorization: Bearer ${token}"`;
}
