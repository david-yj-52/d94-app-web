import {Avatar, IssueTypeIcon, PriorityIcon, StatusLozenge} from "@/components/cira/ui/Badges";
import type {FieldDef} from "@/types/fields";
import type {IssueResponse} from "@/types/issue";

const date = (v?: string | null) => (v ? new Date(v).toLocaleDateString("ko-KR") : "-");
const dateTime = (v?: string | null) => (v ? new Date(v).toLocaleString("ko-KR", {dateStyle: "short", timeStyle: "short"}) : "-");
const person = (name?: string | null) => (
    <span className="flex items-center gap-1.5 text-xs text-slate-600"><Avatar name={name}/>{name ?? "미지정"}</span>
);
const chip = (v: string) => (
    <span key={v} className="mr-1 inline-flex h-5 items-center rounded bg-slate-100 px-1.5 text-[11px] text-slate-700">{v}</span>
);

/** 목록 칸 정렬: 숫자는 오른쪽 */
export const isNumeric = (f: FieldDef) => f.fieldType === "NUMBER";

/**
 * 필드 하나의 읽기 전용 값. names = userId/sprintId → 이름 (없으면 id 그대로)
 */
export default function FieldValue({field, issue, names = {}}: {
    field: FieldDef;
    issue: IssueResponse;
    names?: Record<string, string>;
}) {
    switch (field.fieldKey) {
        case "sys:type": return <IssueTypeIcon typeName={issue.issueTypeNm}/>;
        case "sys:key": return <span className="font-mono text-xs text-slate-500">{issue.issueKey}</span>;
        case "sys:summary": return <span className="font-medium text-slate-900">{issue.title}</span>;
        case "sys:status": return <StatusLozenge label={issue.statusNm}/>;
        case "sys:priority": return <span className="inline-flex"><PriorityIcon priority={issue.priority}/></span>;
        case "sys:assignee": return person(issue.assignee?.name);
        case "sys:reporter": return person(issue.reporter?.name);
        case "sys:storyPoints": return <>{issue.storyPnt ?? "-"}</>;
        case "sys:sprint": return <>{issue.sprintId ? names[issue.sprintId] ?? "-" : "-"}</>;
        case "sys:dueDate": return <>{date(issue.dueDt)}</>;
        case "sys:startedAt": return <>{dateTime(issue.startedAt)}</>;
        case "sys:resolvedAt": return <>{dateTime(issue.resolvedAt)}</>;
        case "sys:createdAt": return <>{date(issue.createdAt)}</>;
        case "sys:modifiedAt": return <>{date(issue.modifiedAt ?? issue.createdAt)}</>;
    }
    const v = issue.customFields?.[field.fieldKey];
    if (v === undefined || v === null || v === "") return <span className="text-slate-300">-</span>;
    switch (field.fieldType) {
        case "NUMBER": return <>{Number(v).toLocaleString("ko-KR")}</>;
        case "DATE": return <>{date(String(v))}</>;
        case "DATETIME": return <>{dateTime(String(v))}</>;
        case "SELECT": return chip(String(v));
        case "MULTI_SELECT": return <>{(v as string[]).map(chip)}</>;
        case "USER": return person(names[String(v)] ?? String(v));
        case "URL":
            return (
                <a href={String(v)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                   className="text-d94-brand hover:underline">{String(v)}</a>
            );
        case "CHECKBOX": return <>{v ? "✓" : ""}</>;
        default: return <>{String(v)}</>;
    }
}
