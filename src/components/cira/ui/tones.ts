// 상태 분류·이슈 유형·우선순위 → 표시 색/라벨 (CIRA 디자인 토큰, ADR 0006)

export type StatusTone = "todo" | "inProgress" | "done";

export function statusTone(category?: string | null): StatusTone {
    if (category === "IN_PROGRESS") return "inProgress";
    if (category === "DONE") return "done";
    return "todo";
}

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
    todo: "bg-gray-100 text-gray-700",
    inProgress: "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
};

export type IssueTypeTone = "story" | "bug" | "task";

// ponytail: 유형 API 가 없어 이름으로 추정. 백엔드가 유형 코드를 주면 코드로 판정
export function issueTypeTone(typeName?: string | null): IssueTypeTone {
    const name = (typeName ?? "").trim().toLowerCase();
    if (name === "bug" || name === "버그") return "bug";
    if (name === "story" || name === "스토리") return "story";
    return "task";
}

export const ISSUE_TYPE_CLASS: Record<IssueTypeTone, string> = {
    story: "bg-green-500",
    bug: "bg-red-500",
    task: "bg-blue-500",
};

export type PriorityTone = "highest" | "high" | "medium" | "low" | "lowest";

const PRIORITY_META: Record<string, { label: string; tone: PriorityTone }> = {
    HIGHEST: {label: "최고", tone: "highest"},
    HIGH: {label: "높음", tone: "high"},
    MEDIUM: {label: "보통", tone: "medium"},
    LOW: {label: "낮음", tone: "low"},
    LOWEST: {label: "최저", tone: "lowest"},
};

export function priorityMeta(priority?: string | null): { label: string; tone: PriorityTone } | null {
    return (priority && PRIORITY_META[priority]) || null;
}

export const PRIORITY_CLASS: Record<PriorityTone, string> = {
    highest: "text-red-600",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-gray-400",
    lowest: "text-gray-300",
};
