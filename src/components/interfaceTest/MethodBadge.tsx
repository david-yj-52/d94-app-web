import type {InterfaceTestMethod} from "@/types/interfaceTest";

export const METHOD_COLOR: Record<InterfaceTestMethod, string> = {
    GET: "bg-blue-50 text-blue-700 border-blue-200",
    HEAD: "bg-slate-50 text-slate-700 border-slate-200",
    POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PUT: "bg-amber-50 text-amber-700 border-amber-200",
    PATCH: "bg-violet-50 text-violet-700 border-violet-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
};

export default function MethodBadge({method}: { method: InterfaceTestMethod }) {
    return (
        <span
            className={`inline-flex w-16 shrink-0 justify-center rounded-full border px-2 py-0.5 font-mono text-xs font-bold ${METHOD_COLOR[method]}`}
        >
            {method}
        </span>
    );
}
