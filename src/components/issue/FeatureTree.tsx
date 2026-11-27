"use client";

import {StatusLozenge} from "@/components/cira/ui/Badges";
import type {Space, FeatureNode} from "@/types/space";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

/** 2단계 Feature 트리. 서버가 COMMON 을 먼저 주므로 순서를 바꾸지 않는다. 공통 = "공통" 배지, 단위 = 공간 이름 배지 */
export default function FeatureTree({projectId, nodes, spaces}: {
    projectId: string;
    nodes: FeatureNode[];
    spaces: Space[];
}) {
    const spaceNm = (id?: string | null) => spaces.find((s) => s.id === id)?.name ?? "-";
    const row = (n: FeatureNode, child: boolean) => {
        const f = n.feature;
        const isCommon = f.featureScope === "COMMON";
        return (
            <li key={f.id} className={child ? "border-l-2 border-slate-200 pl-4" : ""}>
                <Link href={`/cira/projects/${projectId}/issues/${f.id}`}
                      className="flex min-h-10 items-center gap-2 rounded-md px-2 text-sm no-underline hover:bg-slate-50">
                    <Badge className={`shrink-0 ${isCommon ? "bg-d94-brand-soft text-d94-brand" : ""}`}>
                        {isCommon ? "공통" : spaceNm(f.spaceId)}
                    </Badge>
                    <span className="shrink-0 font-mono text-xs text-slate-500">{f.issueKey}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-800">{f.title}</span>
                    <span className="shrink-0 text-xs text-slate-400">Task {n.taskCount}</span>
                    <StatusLozenge label={f.statusNm}/>
                </Link>
                {n.children.length > 0 && <ul className="ml-4 mt-1 space-y-1">{n.children.map((c) => row(c, true))}</ul>}
            </li>
        );
    };
    return <ul className="space-y-1">{nodes.map((n) => row(n, false))}</ul>;
}
