"use client";

import MetricChart from "@/components/infra/MetricChart";
import NodeFormModal from "@/components/infra/NodeFormModal";
import ProcessTable from "@/components/infra/ProcessTable";
import ServiceFormModal from "@/components/infra/ServiceFormModal";
import UsageBar from "@/components/infra/UsageBar";
import {fmtMb, fmtUptime, infraError, parseExtra} from "@/components/infra/format";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {useConfirm} from "@/components/ui/ConfirmDialog";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useDeleteInfraNode, useDeleteInfraService, useInfraMetrics, useInfraNode} from "@/hooks/useInfra";
import {useIsAdmin} from "@/hooks/useSettings";
import {type InfraService, LOCATION_LABEL, type MetricRange, NODE_TYPE_LABEL, SERVICE_KIND_LABEL, STATUS_LABEL} from "@/types/infra";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {useState} from "react";

const RANGES: MetricRange[] = ["1h", "6h", "24h", "7d"];

export default function InfraNodePage() {
    const {nodeKey} = useParams<{ nodeKey: string }>();
    const router = useRouter();
    const isAdmin = useIsAdmin();
    const {show, ToastComponent} = useToast();
    const {confirm, ConfirmComponent} = useConfirm();
    const [range, setRange] = useState<MetricRange>("1h");
    const [editing, setEditing] = useState(false);
    const [svcEdit, setSvcEdit] = useState<InfraService | "new" | null>(null);
    const {data, isLoading, isError} = useInfraNode(nodeKey);
    const {data: series = []} = useInfraMetrics(nodeKey, range);
    const delNode = useDeleteInfraNode();
    const delSvc = useDeleteInfraService(nodeKey);

    if (isLoading) return <div className="mx-auto max-w-5xl space-y-4 px-4 py-8"><SkeletonCard/><SkeletonCard/></div>;
    if (isError || !data) return <p className="py-20 text-center text-sm text-slate-500">노드를 찾을 수 없습니다.</p>;

    const {node: n, latest: m, online, memFreeMb, gpuMemFreeMb} = data.summary;
    const sshCmd = n.sshAlias ? `ssh ${n.sshAlias}` : n.hostLabel && n.sshUser
        ? `ssh ${n.sshPort && n.sshPort !== 22 ? `-p ${n.sshPort} ` : ""}${n.sshKeyHint ? `-i ${n.sshKeyHint} ` : ""}${n.sshUser}@${n.hostLabel}` : null;
    const extra = parseExtra(m?.extraJson);
    const copy = (text: string) => navigator.clipboard.writeText(text).then(() => show("복사했습니다."), () => show("복사에 실패했습니다.", "error"));

    const removeNode = async () => {
        if (!await confirm(`${n.name} 와 수집된 메트릭·서비스 문서를 모두 지웁니다.`, {title: "노드 삭제", confirmLabel: "삭제", danger: true})) return;
        delNode.mutate(n.nodeKey, {onSuccess: () => router.push("/infra"), onError: (e) => show(infraError(e, "삭제하지 못했습니다."), "error")});
    };

    const spec: [string, string | null][] = [
        ["OS", n.osInfo], ["CPU", n.cpuModel && `${n.cpuModel}${n.cpuCores ? ` · ${n.cpuCores}코어` : ""}`],
        ["RAM", n.memoryTotalMb ? fmtMb(n.memoryTotalMb) : null], ["GPU", n.gpuModel && `${n.gpuModel}${n.gpuMemoryMb ? ` · ${fmtMb(n.gpuMemoryMb)}` : ""}`],
        ["Disk", n.diskTotalGb ? `${n.diskTotalGb} GB` : null], ["Uptime", m ? fmtUptime(m.uptimeSec) : null],
        ["Load(1m)", m?.loadAvg1m != null ? m.loadAvg1m.toFixed(2) : null],
        ["마지막 보고", n.lastSeenAt && new Date(n.lastSeenAt).toLocaleString("ko-KR")],
    ];

    return (
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
            <Link href="/infra" className="text-sm text-slate-500 hover:text-d94-brand">← 인프라</Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{n.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">{n.nodeKey} · {NODE_TYPE_LABEL[n.nodeType]} · {LOCATION_LABEL[n.location]}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>{online ? "Online" : "Offline"}</Badge>
                    <Badge>{STATUS_LABEL[n.status]}</Badge>
                    {isAdmin && <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>수정</Button>}
                    {isAdmin && <Button type="button" size="sm" variant="danger" onClick={removeNode}>삭제</Button>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-3 font-semibold text-slate-900">하드웨어 · 현재 사용량</h2>
                    <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
                        {spec.map(([k, v]) => <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="text-slate-800">{v || "—"}</dd></div>)}
                    </dl>
                    {m && (
                        <div className="mt-4 space-y-2">
                            <UsageBar label="CPU" pct={m.cpuPct}/>
                            <UsageBar label="메모리" pct={m.memPct} detail={`유휴 ${fmtMb(memFreeMb)}`}/>
                            <UsageBar label="디스크" pct={m.diskPct} detail={m.diskUsedGb != null ? `${m.diskUsedGb} GB 사용` : undefined}/>
                            {m.gpuUtilPct != null && <UsageBar label="GPU" pct={m.gpuUtilPct} detail={gpuMemFreeMb != null ? `VRAM 유휴 ${fmtMb(gpuMemFreeMb)}` : undefined}/>}
                        </div>
                    )}
                    {extra && <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{JSON.stringify(extra, null, 1)}</pre>}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-3 font-semibold text-slate-900">접속 가이드</h2>
                    {sshCmd ? (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100">
                            <span className="flex-1 truncate">{sshCmd}</span>
                            <Button type="button" size="sm" variant="ghost" className="text-slate-200" onClick={() => copy(sshCmd)}>복사</Button>
                        </div>
                    ) : <p className="text-sm text-slate-400">SSH 별칭이 없습니다.</p>}
                    <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
                        <dt className="text-slate-500">호스트</dt><dd>{n.hostLabel || "—"}</dd>
                        <dt className="text-slate-500">사용자</dt><dd>{n.sshUser || "—"}</dd>
                        <dt className="text-slate-500">포트</dt><dd>{n.sshPort ?? "—"}</dd>
                        <dt className="text-slate-500">키 경로</dt><dd className="font-mono text-xs">{n.sshKeyHint || "—"}</dd>
                    </dl>
                    {n.accessNotes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{n.accessNotes}</p>}
                </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">사용률 추이</h2>
                    <div role="tablist" className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                        {RANGES.map((r) => (
                            <Button variant="unstyled" key={r} type="button" role="tab" aria-selected={range === r} onClick={() => setRange(r)}
                                    className={`rounded-md px-2.5 py-1 ${range === r ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-500"}`}>{r}</Button>
                        ))}
                    </div>
                </div>
                <MetricChart data={series} showGpu={series.some((s) => s.gpuUtilPct != null)}/>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-slate-900">프로세스 · 컨테이너 메모리 Top-N</h2>
                <ProcessTable rows={data.processes}/>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">서비스</h2>
                    {isAdmin && <Button type="button" size="sm" onClick={() => setSvcEdit("new")}>서비스 추가</Button>}
                </div>
                {data.services.length === 0 ? <p className="text-sm text-slate-400">문서화된 서비스가 없습니다.</p> : (
                    <ul className="divide-y divide-slate-100">
                        {data.services.map((s) => (
                            <li key={s.id} className="flex items-start justify-between gap-3 py-2">
                                <div className="min-w-0 text-sm">
                                    <p className="font-medium text-slate-800">{s.name} <Badge>{SERVICE_KIND_LABEL[s.kind]}</Badge></p>
                                    <p className="truncate text-xs text-slate-500">
                                        {[s.portsText && `포트 ${s.portsText}`, s.estimatedMemMb && `~${fmtMb(s.estimatedMemMb)}`, s.endpointUrl, s.composePath].filter(Boolean).join(" · ")}
                                    </p>
                                    {s.description && <p className="mt-0.5 text-xs text-slate-600">{s.description}</p>}
                                </div>
                                {isAdmin && (
                                    <div className="flex shrink-0 gap-1">
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setSvcEdit(s)}>수정</Button>
                                        <Button type="button" size="sm" variant="ghost" className="text-red-500"
                                                onClick={() => delSvc.mutate(s.id!, {onError: (e) => show(infraError(e, "삭제하지 못했습니다."), "error")})}>삭제</Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {editing && <NodeFormModal initial={n} onClose={() => setEditing(false)}/>}
            {svcEdit && <ServiceFormModal nodeKey={n.nodeKey} initial={svcEdit === "new" ? undefined : svcEdit} onClose={() => setSvcEdit(null)}/>}
            {ToastComponent}
            {ConfirmComponent}
        </div>
    );
}
