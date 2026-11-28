"use client";

import {Avatar, CommonFeatureBadge, IssueTypeIcon, PriorityIcon, StatusLozenge} from "@/components/cira/ui/Badges";
import {useCommonFeatures} from "@/hooks/useSpaces";
import type {FieldDef} from "@/types/fields";
import type {IssueResponse} from "@/types/issue";
import {ChevronDown, ChevronUp} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import FieldValue, {isNumeric} from "./FieldValue";
import Button from "@/components/ui/Button";

interface Props {
    issues: IssueResponse[];
    projectId?: string; // 없으면 Task의 projectId (검색 결과처럼 여러 프로젝트가 섞일 때)
    emptyText?: string;
    /** 프로젝트 유효 필드 + 표시할 키. 둘 다 있으면 동적 컬럼, 없으면 고정 컬럼 (검색 결과) */
    fields?: FieldDef[];
    columns?: string[];
    /** userId·sprintId → 이름 */
    names?: Record<string, string>;
    /** "sys:dueDate,asc". onSort 가 있으면 sys: 헤더를 눌러 정렬 */
    sort?: string;
    onSort?: (sort: string) => void;
    /** spaceId → 이름. 있으면 고정 컬럼에 "공간" 열 (프로젝트 통합 Task 목록) */
    spaceNames?: Record<string, string>;
}

const FIXED_COLUMNS = ["sys:type", "sys:key", "sys:summary", "sys:status", "sys:priority", "sys:assignee", "sys:modifiedAt"];
const WIDTH: Record<string, string> = {
    "sys:type": "w-8 pl-4", "sys:key": "w-28", "sys:status": "w-32", "sys:priority": "w-12 text-center",
    "sys:assignee": "w-32", "sys:reporter": "w-32", "sys:space": "w-28",
};
const fixedField = (key: string, name: string): FieldDef =>
    ({fieldKey: key, name, kind: "sys", fieldType: "TEXT", required: false, sortable: false, defaultVisible: true});
const FIXED_FIELDS = new Map(
    [["sys:type", ""], ["sys:key", "키"], ["sys:summary", "요약"], ["sys:status", "상태"], ["sys:priority", "P"],
        ["sys:assignee", "담당자"], ["sys:modifiedAt", "수정일"], ["sys:space", "공간"]].map(([k, n]) => [k, fixedField(k, n)]),
);

// md 이상은 표, 모바일은 카드 목록
export default function IssueTable({issues, projectId, emptyText = "Task가 없습니다.", fields, columns, names, sort, onSort, spaceNames}: Props) {
    const router = useRouter();
    const href = (issue: IssueResponse) => `/cira/projects/${projectId ?? issue.projectId}/issues/${issue.id}`;

    const byKey = new Map((fields ?? []).map((f) => [f.fieldKey, f]));
    const dynamic = !!fields && !!columns;
    const cols: FieldDef[] = dynamic
        ? columns.map((k) => byKey.get(k)).filter((f): f is FieldDef => !!f)
        : (spaceNames ? FIXED_COLUMNS.flatMap((k) => (k === "sys:key" ? [k, "sys:space"] : [k])) : FIXED_COLUMNS)
            .map((k) => FIXED_FIELDS.get(k)!);
    const [sortKey, sortDir] = (sort ?? "").split(",");
    // 설계 3.2: 공통 Feature 에 연결된 Task 는 배지 + (정렬을 고르지 않았으면) 이 페이지 안에서 먼저
    const common = useCommonFeatures(projectId);
    const commonOf = (i: IssueResponse) => common.get(i.featureId ?? "");
    const rows = sort ? issues : [...issues.filter((i) => commonOf(i)), ...issues.filter((i) => !commonOf(i))];
    const mobileExtras = cols.filter((f) => f.kind === "cf").slice(0, 2);

    if (issues.length === 0) {
        return <div className="py-16 text-center text-sm text-slate-400">{emptyText}</div>;
    }

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        {cols.map((f, i) => {
                            const canSort = !!onSort && dynamic && f.sortable;
                            const active = sortKey === f.fieldKey;
                            const label = f.fieldKey === "sys:type" ? "" : f.name;
                            return (
                                <th key={f.fieldKey}
                                    aria-label={f.fieldKey === "sys:type" ? "유형" : undefined}
                                    aria-sort={active ? (sortDir === "desc" ? "descending" : "ascending") : undefined}
                                    className={`pb-2 font-medium whitespace-nowrap ${WIDTH[f.fieldKey] ?? ""} ${isNumeric(f) ? "text-right" : ""} ${i === cols.length - 1 ? "pr-4" : "pr-3"}`}>
                                    {canSort ? (
                                        <Button variant="unstyled" type="button" className="inline-flex items-center gap-0.5 hover:text-slate-900"
                                                onClick={() => onSort(`${f.fieldKey},${active && sortDir !== "desc" ? "desc" : "asc"}`)}>
                                            {label}
                                            {active && (sortDir === "desc" ? <ChevronDown className="h-3 w-3"/> : <ChevronUp className="h-3 w-3"/>)}
                                        </Button>
                                    ) : label}
                                </th>
                            );
                        })}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((issue) => (
                        <tr
                            key={issue.id}
                            onClick={() => router.push(href(issue))}
                            className="h-9 cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                        >
                            {cols.map((f, i) => (
                                <td key={f.fieldKey}
                                    className={`${WIDTH[f.fieldKey] ?? ""} ${f.fieldKey === "sys:summary" || (f.kind === "cf" && f.fieldType === "TEXT") ? "max-w-xs truncate" : "whitespace-nowrap"} ${isNumeric(f) ? "text-right" : ""} ${i === cols.length - 1 ? "pr-4" : "pr-3"} text-xs text-slate-600`}>
                                    {f.fieldKey === "sys:summary" && commonOf(issue) && <span className="mr-1.5"><CommonFeatureBadge feature={commonOf(issue)!}/></span>}
                                    {f.fieldKey === "sys:space"
                                        ? (spaceNames?.[issue.spaceId ?? ""] ?? "-")
                                        : <FieldValue field={f} issue={issue} names={names}/>}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
                {rows.map((issue) => (
                    <li key={issue.id}>
                        <Link href={href(issue)} className="block px-3 py-3 active:bg-slate-50">
                            <div className="mb-1 flex items-center gap-2">
                                <IssueTypeIcon typeName={issue.issueTypeNm}/>
                                <span className="font-mono text-xs text-slate-500">{issue.issueKey}</span>
                                <span className="flex-1"/>
                                <PriorityIcon priority={issue.priority}/>
                            </div>
                            {commonOf(issue) && <div className="mb-1"><CommonFeatureBadge feature={commonOf(issue)!}/></div>}
                            <p className="mb-2 text-sm font-medium text-slate-900">{issue.title}</p>
                            {spaceNames && <p className="mb-1 text-xs text-slate-500">공간: <span>{spaceNames[issue.spaceId ?? ""] ?? "-"}</span></p>}
                            {mobileExtras.length > 0 && (
                                <p className="mb-2 flex gap-3 text-xs text-slate-500">
                                    {mobileExtras.map((f) => (
                                        <span key={f.fieldKey}>{f.name}: <FieldValue field={f} issue={issue} names={names}/></span>
                                    ))}
                                </p>
                            )}
                            <div className="flex items-center justify-between">
                                <StatusLozenge label={issue.statusNm}/>
                                <Avatar name={issue.assignee?.name}/>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}
