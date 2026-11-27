import Badge from "@/components/ui/Badge";
import {LOCATION_LABEL, NODE_TYPE_LABEL, type NodeSummary} from "@/types/infra";
import Link from "next/link";
import {fmtMb, parseExtra} from "./format";
import UsageBar from "./UsageBar";

/** 종합 현황 카드: 상태·스펙·CPU/메모리/디스크/GPU 게이지·유휴 메모리 */
export default function NodeCard({summary}: { summary: NodeSummary }) {
    const {node, latest: m, online, memFreeMb, gpuMemFreeMb} = summary;
    const extra = parseExtra(m?.extraJson);
    const gpuPct = node.gpuMemoryMb && m?.gpuMemUsedMb != null ? (m.gpuMemUsedMb / node.gpuMemoryMb) * 100 : null;
    return (
        <Link href={`/infra/${node.nodeKey}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-d94-brand hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{node.name}</h3>
                    <p className="text-xs text-slate-400">{node.nodeKey} · {NODE_TYPE_LABEL[node.nodeType]} · {LOCATION_LABEL[node.location]}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                    {node.status !== "ACTIVE" && <Badge className="bg-amber-50 text-amber-700">{node.status === "PLANNED" ? "예정" : "점검"}</Badge>}
                    <Badge className={online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {online ? "Online" : "Offline"}
                    </Badge>
                </div>
            </div>
            <p className="mt-2 truncate text-xs text-slate-500">
                {[node.cpuCores && `${node.cpuCores} vCPU`, node.memoryTotalMb && `RAM ${fmtMb(node.memoryTotalMb)}`,
                    node.gpuModel, node.diskTotalGb && `Disk ${node.diskTotalGb} GB`].filter(Boolean).join(" · ") || "스펙 미입력"}
            </p>
            {m ? (
                <div className="mt-4 space-y-2">
                    {m.cpuPct != null && <UsageBar label="CPU" pct={m.cpuPct}/>}
                    {m.memPct != null && <UsageBar label="메모리" pct={m.memPct} detail={`유휴 ${fmtMb(memFreeMb)}`}/>}
                    {m.diskPct != null && <UsageBar label="디스크" pct={m.diskPct}/>}
                    {gpuPct != null && <UsageBar label="GPU 메모리" pct={gpuPct} detail={`유휴 ${fmtMb(gpuMemFreeMb)}`}/>}
                    {extra && "free_heap_kb" in extra && (
                        <p className="text-xs text-slate-500">heap {String(extra.free_heap_kb)} KB · RSSI {String(extra.wifi_rssi ?? "—")}</p>
                    )}
                    {extra?.source === "vercel" && <p className="text-xs text-slate-500">최근 배포: {String(extra.latestState || "—")}</p>}
                </div>
            ) : (
                <p className="mt-4 text-xs text-slate-400">아직 수집된 메트릭이 없습니다.</p>
            )}
        </Link>
    );
}
