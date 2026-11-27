"use client";

import NodeCard from "@/components/infra/NodeCard";
import NodeFormModal from "@/components/infra/NodeFormModal";
import {fmtMb} from "@/components/infra/format";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useInfraNodes} from "@/hooks/useInfra";
import {useIsAdmin} from "@/hooks/useSettings";
import type {NodeLocation} from "@/types/infra";
import {useState} from "react";

const FILTERS: { value: NodeLocation | "ALL"; label: string }[] = [
    {value: "ALL", label: "전체"}, {value: "HOME_LAN", label: "Home"}, {value: "OCI", label: "OCI"}, {value: "VERCEL", label: "Vercel"},
];

export default function InfraPage() {
    const [filter, setFilter] = useState<NodeLocation | "ALL">("ALL");
    const [creating, setCreating] = useState(false);
    const isAdmin = useIsAdmin();
    const {data = [], isLoading} = useInfraNodes();
    const nodes = filter === "ALL" ? data : data.filter((s) => s.node.location === filter);

    // 요약: 메트릭을 보고하는 노드의 물리 메모리 합계 대비 사용·유휴
    const reporting = nodes.filter((s) => s.latest && s.node.memoryTotalMb);
    const total = reporting.reduce((a, s) => a + (s.node.memoryTotalMb ?? 0), 0);
    const free = reporting.reduce((a, s) => a + (s.memFreeMb ?? 0), 0);
    const online = nodes.filter((s) => s.online).length;

    return (
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">인프라</h1>
                    <p className="mt-1 text-sm text-slate-500">장비별 스펙·사용량·유휴 자원을 한곳에서 봅니다. 60초마다 갱신됩니다.</p>
                </div>
                {isAdmin && <Button type="button" className="shrink-0" onClick={() => setCreating(true)}>노드 등록</Button>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div role="tablist" className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
                    {FILTERS.map((f) => (
                        <Button variant="unstyled" key={f.value} type="button" role="tab" aria-selected={filter === f.value}
                                onClick={() => setFilter(f.value)}
                                className={`rounded-md px-3 py-1.5 ${filter === f.value ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-500"}`}>
                            {f.label}
                        </Button>
                    ))}
                </div>
                <p className="text-sm text-slate-600">
                    노드 {nodes.length}대 · Online {online} · 메모리 {fmtMb(total - free)} 사용 / {fmtMb(total)} (유휴 {fmtMb(free)})
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <SkeletonCard key={i}/>)}</div>
            ) : nodes.length === 0 ? (
                <EmptyState>등록된 노드가 없습니다. 에이전트가 처음 보고하면 자동으로 등록되고, &lsquo;노드 등록&rsquo;으로 예정 장비를 미리 적을 수도 있습니다.</EmptyState>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {nodes.map((s) => <NodeCard key={s.node.nodeKey} summary={s}/>)}
                </div>
            )}

            {creating && <NodeFormModal onClose={() => setCreating(false)}/>}
        </div>
    );
}
