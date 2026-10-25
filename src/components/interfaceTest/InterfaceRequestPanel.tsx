"use client";

import type {InterfaceCallRequest, InterfaceTestItemRequest, InterfaceTestMethod} from "@/types/interfaceTest";
import MethodBadge from "./MethodBadge";

export interface InterfaceRequestForm {
    itemId: string;
    name: string;
    content: string;
    status: string;
}

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "DONE"];

interface Action {
    method: InterfaceTestMethod;
    needsId: boolean;
    label: string;
    hint: string;
}

const ACTIONS: Action[] = [
    {method: "GET", needsId: false, label: "목록 조회", hint: "/v1/interface-tests"},
    {method: "GET", needsId: true, label: "단건 조회", hint: "/v1/interface-tests/{id}"},
    {method: "HEAD", needsId: true, label: "존재 확인", hint: "본문 없이 상태만"},
    {method: "POST", needsId: false, label: "생성", hint: "name 필수 → 201"},
    {method: "PUT", needsId: true, label: "전체 수정", hint: "빈 필드는 비움·기본값"},
    {method: "PATCH", needsId: true, label: "부분 수정", hint: "입력한 필드만"},
    {method: "DELETE", needsId: true, label: "삭제", hint: "→ 204"},
];

/** 메서드별 본문: POST·PUT 은 폼 전체, PATCH 는 값이 있는 필드만 */
function buildBody(method: InterfaceTestMethod, form: InterfaceRequestForm): InterfaceTestItemRequest | undefined {
    if (method === "POST" || method === "PUT") {
        return {name: form.name, content: form.content || undefined, status: form.status || undefined};
    }
    if (method === "PATCH") {
        const body: InterfaceTestItemRequest = {};
        if (form.name) body.name = form.name;
        if (form.content) body.content = form.content;
        if (form.status) body.status = form.status;
        return body;
    }
    return undefined;
}

interface Props {
    form: InterfaceRequestForm;
    onChange: (form: InterfaceRequestForm) => void;
    onCall: (req: InterfaceCallRequest) => void;
    isPending: boolean;
}

export default function InterfaceRequestPanel({form, onChange, onCall, isPending}: Props) {
    const set = (key: keyof InterfaceRequestForm) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            onChange({...form, [key]: e.target.value});

    const fieldClass =
        "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-slate-900">요청</h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                        대상 ID <span className="text-slate-400">(목록에서 선택하거나 직접 입력)</span>
                    </label>
                    <input value={form.itemId} onChange={set("itemId")} placeholder="단건 메서드에 사용"
                           className={`${fieldClass} font-mono`}/>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">name</label>
                    <input value={form.name} onChange={set("name")} placeholder="POST·PUT 필수" className={fieldClass}/>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">status</label>
                    <select value={form.status} onChange={set("status")} className={fieldClass}>
                        <option value="">(보내지 않음)</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-600">content</label>
                    <textarea value={form.content} onChange={set("content")} rows={2}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ACTIONS.map((a) => {
                    const disabled = isPending || (a.needsId && !form.itemId.trim());
                    return (
                        <button
                            key={`${a.method}-${a.label}`}
                            type="button"
                            aria-label={`${a.method} ${a.label}`}
                            disabled={disabled}
                            onClick={() => onCall({
                                method: a.method,
                                itemId: a.needsId ? form.itemId.trim() : undefined,
                                body: buildBody(a.method, form),
                            })}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <MethodBadge method={a.method}/>
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-slate-800">{a.label}</span>
                                <span className="block truncate text-xs text-slate-500">{a.hint}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
