"use client";

import type {FieldDef} from "@/types/fields";
import type {CustomFieldValue} from "@/types/issue";
import type {ProjectMemberResponse} from "@/types/member";

const cls = "w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/**
 * 사용자 정의 필드 입력 (타입별). onChange 는 값이 확정될 때 호출된다:
 * 텍스트·숫자·URL 은 blur, 나머지는 선택 즉시. 빈 값은 null.
 */
export default function CustomFieldInput({field, value, onChange, members = [], id}: {
    field: FieldDef;
    value: CustomFieldValue | undefined;
    onChange: (v: CustomFieldValue) => void;
    members?: ProjectMemberResponse[];
    id?: string;
}) {
    const str = value === null || value === undefined ? "" : String(value);
    const commit = (raw: string) => {
        const t = raw.trim();
        if (t === str) return;
        onChange(t === "" ? null : field.fieldType === "NUMBER" ? Number(t) : t);
    };
    switch (field.fieldType) {
        case "SELECT":
        case "USER":
            return (
                <select id={id} className={cls} value={str} onChange={(e) => onChange(e.target.value || null)}>
                    <option value="">선택 안 함</option>
                    {field.fieldType === "SELECT"
                        ? (field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)
                        : members.map((m) => <option key={m.userId} value={m.userId}>{m.userNm}</option>)}
                </select>
            );
        case "MULTI_SELECT": {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div id={id} className="flex flex-wrap gap-x-3 gap-y-1">
                    {(field.options ?? []).map((o) => (
                        <label key={o} className="flex items-center gap-1 text-sm">
                            <input type="checkbox" checked={selected.includes(o)} onChange={(e) => {
                                const next = e.target.checked ? [...selected, o] : selected.filter((x) => x !== o);
                                onChange(next.length ? next : null);
                            }}/>
                            {o}
                        </label>
                    ))}
                </div>
            );
        }
        case "CHECKBOX":
            return <input id={id} type="checkbox" className="h-4 w-4" checked={value === true} onChange={(e) => onChange(e.target.checked)}/>;
        case "DATE":
            return <input id={id} type="date" className={cls} defaultValue={str} onBlur={(e) => commit(e.target.value)}/>;
        case "DATETIME":
            return <input id={id} type="datetime-local" className={cls} defaultValue={str.slice(0, 16)}
                          onBlur={(e) => commit(e.target.value)}/>;
        default:
            return (
                <input id={id} key={str} className={cls} defaultValue={str}
                       type={field.fieldType === "NUMBER" ? "number" : field.fieldType === "URL" ? "url" : "text"}
                       onBlur={(e) => commit(e.target.value)}
                       onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}/>
            );
    }
}
