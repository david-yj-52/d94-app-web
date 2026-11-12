"use client";

import {useMutation, useQuery} from "@tanstack/react-query";
import {useToast} from "@/components/ui/Toast";
import {getPlugins, getSetupCheck, sendTestNotify, syncPlugins} from "@/lib/api/ayaan";
import {SETUP_STEPS} from "../constant/setupSteps";
import {btnPrimary, btnSecondary} from "../format";

export default function AyaanSetupPage() {
    const {show, ToastComponent} = useToast();
    const check = useQuery({queryKey: ["ayaanSetup"], queryFn: getSetupCheck});
    const notify = useMutation({
        mutationFn: sendTestNotify,
        onSuccess: (ok) => show(ok ? "테스트 알림을 보냈습니다." : "알림 전송에 실패했습니다.", ok ? "success" : "error"),
        onError: () => show("알림 전송에 실패했습니다.", "error"),
    });
    const installed = useQuery({queryKey: ["ayaanPlugins"], queryFn: getPlugins});
    const sync = useMutation({
        mutationFn: syncPlugins,
        onSuccess: (rs) => {
            installed.refetch();
            show(rs.every((r) => r.ok) ? "플러그인을 설치했습니다." : "일부 플러그인 설치에 실패했습니다.", rs.every((r) => r.ok) ? "success" : "error");
        },
        onError: () => show("플러그인 설치에 실패했습니다.", "error"),
    });
    const copy = (text: string) =>
        navigator.clipboard.writeText(text).then(() => show("복사했습니다."), () => show("복사에 실패했습니다.", "error"));
    return (
        <div className="mx-auto max-w-4xl space-y-5 px-4">
            <div className="flex items-end justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Ayaan 셋업</h1>
                <div className="flex gap-2">
                    <button className={btnSecondary} disabled={check.isFetching} onClick={() => check.refetch()}>다시 점검</button>
                    <button className={btnPrimary} disabled={notify.isPending} onClick={() => notify.mutate()}>테스트 알림</button>
                </div>
            </div>
            {SETUP_STEPS.map((s) => {
                const r = check.data?.find((c) => c.step === s.step);
                return (
                    <section key={s.step} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                            {s.step}단계. {s.title}
                            {r && <span role="img" aria-label={r.ok ? "통과" : "실패"}>{r.ok ? "✅" : "❌"}</span>}
                        </h2>
                        <p className="text-sm text-slate-600"><b>왜:</b> {s.why}</p>
                        <p className="mt-1 text-sm text-slate-600"><b>할 일:</b> {s.todo}</p>
                        {s.commands.map((c, i) => (
                            <div key={i} className="relative mt-2">
                                <pre className="overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{c}</pre>
                                <button className="absolute right-2 top-2 rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                                        onClick={() => copy(c)}>복사</button>
                            </div>
                        ))}
                        <p className="mt-2 text-sm text-slate-600"><b>자동 점검:</b> {s.check}</p>
                        {r && (
                            <ul className="mt-2 space-y-1 text-xs">
                                {r.items.map((it) => (
                                    <li key={it.name} className={it.ok ? "text-emerald-700" : "text-red-600"}>
                                        {it.ok ? "✅" : "❌"} {it.name}{it.detail ? ` — ${it.detail}` : ""}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 flex items-center justify-between font-bold text-slate-900">
                    Claude 플러그인
                    <button className={btnPrimary} disabled={sync.isPending} onClick={() => sync.mutate()}>
                        {sync.isPending ? "설치 중…" : "플러그인 설치"}
                    </button>
                </h2>
                <p className="text-sm text-slate-600">기준정보 <code>CLAUDE_PLUGINS</code> 목록을 서버 Claude에 설치합니다. ayaan 시작 시에도 자동으로 실행됩니다.</p>
                {sync.data && (
                    <ul className="mt-2 space-y-1 text-xs">
                        {sync.data.map((r) => (
                            <li key={r.plugin} className={r.ok ? "text-emerald-700" : "text-red-600"}>
                                {r.ok ? "✅" : "❌"} {r.plugin} — {r.detail}
                            </li>
                        ))}
                    </ul>
                )}
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{installed.data ?? "불러오는 중…"}</pre>
            </section>
            {ToastComponent}
        </div>
    );
}
