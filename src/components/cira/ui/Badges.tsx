import {ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Equal} from "lucide-react";
import {
    ISSUE_TYPE_CLASS,
    issueTypeTone,
    PRIORITY_CLASS,
    priorityMeta,
    STATUS_TONE_CLASS,
    statusTone,
} from "./tones";

export function StatusLozenge({label, category}: { label?: string | null; category?: string | null }) {
    return (
        <span
            className={`inline-flex h-5 items-center whitespace-nowrap rounded px-1.5 text-[11px] font-semibold uppercase ${STATUS_TONE_CLASS[statusTone(category)]}`}>
            {label || "-"}
        </span>
    );
}

export function IssueTypeIcon({typeName}: { typeName?: string | null }) {
    return (
        <span
            title={typeName || "작업"}
            className={`inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] ${ISSUE_TYPE_CLASS[issueTypeTone(typeName)]}`}
        />
    );
}

const PRIORITY_ICON = {highest: ChevronsUp, high: ArrowUp, medium: Equal, low: ArrowDown, lowest: ChevronsDown};

export function PriorityIcon({priority}: { priority?: string | null }) {
    const meta = priorityMeta(priority);
    if (!meta) return null;
    const Icon = PRIORITY_ICON[meta.tone];
    return (
        <span title={`우선순위: ${meta.label}`} className={PRIORITY_CLASS[meta.tone]}>
            <Icon className="h-4 w-4" aria-label={meta.label}/>
        </span>
    );
}

export function Avatar({name, size = "sm"}: { name?: string | null; size?: "sm" | "md" }) {
    const dim = size === "md" ? "h-8 w-8 text-sm" : "h-6 w-6 text-[11px]";
    return (
        <span
            title={name || "미지정"}
            className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dim} ${
                name ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-400"
            }`}
        >
            {name ? name.slice(0, 1).toUpperCase() : "?"}
        </span>
    );
}
