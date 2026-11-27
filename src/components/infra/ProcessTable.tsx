import Badge from "@/components/ui/Badge";
import type {InfraProcess} from "@/types/infra";
import {fmtMb, fmtPct} from "./format";

/** 최신 스냅샷의 프로세스·컨테이너 메모리 Top-N (서버가 메모리 큰 순으로 줌) */
export default function ProcessTable({rows}: { rows: InfraProcess[] }) {
    if (rows.length === 0) return <p className="py-6 text-center text-sm text-slate-400">수집된 프로세스가 없습니다.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                <tr className="border-b border-slate-100">
                    <th className="py-2 pr-3 font-medium">이름</th>
                    <th className="py-2 pr-3 font-medium">종류</th>
                    <th className="py-2 pr-3 text-right font-medium">메모리</th>
                    <th className="py-2 pr-3 text-right font-medium">MEM%</th>
                    <th className="py-2 pr-3 text-right font-medium">CPU%</th>
                    <th className="py-2 font-medium">명령 / 이미지</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((p, i) => (
                    <tr key={`${p.procType}-${p.pid ?? p.procName}-${i}`} className="border-b border-slate-50 align-top">
                        <td className="py-1.5 pr-3 font-medium text-slate-800">{p.procName}{p.pid != null && <span className="ml-1 text-xs text-slate-400">#{p.pid}</span>}</td>
                        <td className="py-1.5 pr-3">
                            <Badge className={p.procType === "CONTAINER" ? "bg-sky-50 text-sky-700" : undefined}>
                                {p.procType === "CONTAINER" ? "컨테이너" : "프로세스"}
                            </Badge>
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmtMb(p.memRssMb)}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmtPct(p.memPct)}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmtPct(p.cpuPct)}</td>
                        <td className="max-w-xs truncate py-1.5 text-xs text-slate-500" title={p.commandLine ?? ""}>{p.commandLine}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
