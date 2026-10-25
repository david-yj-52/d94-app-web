"use client";

import InterfaceCallLog from "@/components/interfaceTest/InterfaceCallLog";
import InterfaceItemTable from "@/components/interfaceTest/InterfaceItemTable";
import InterfaceRequestPanel, {type InterfaceRequestForm} from "@/components/interfaceTest/InterfaceRequestPanel";
import {useToast} from "@/components/ui/Toast";
import {useInterfaceCall, useInterfaceTestItems} from "@/hooks/useInterfaceTests";
import type {InterfaceCallRequest, InterfaceCallResult, InterfaceTestItemResponse} from "@/types/interfaceTest";
import {isAxiosError} from "axios";
import {useState} from "react";

const MAX_LOGS = 50;
const EMPTY_FORM: InterfaceRequestForm = {itemId: "", name: "", content: "", status: ""};

/** POST 응답 본문 { data: { id } } 에서 새 id 를 꺼낸다 */
function createdIdOf(result: InterfaceCallResult): string | undefined {
    const body = result.responseBody as { data?: { id?: unknown } } | undefined;
    return typeof body?.data?.id === "string" ? body.data.id : undefined;
}

export default function InterfaceTestPage() {
    const [form, setForm] = useState<InterfaceRequestForm>(EMPTY_FORM);
    const [logs, setLogs] = useState<InterfaceCallResult[]>([]);
    const {show, ToastComponent} = useToast();

    const {data: items = [], isLoading, error, refetch} = useInterfaceTestItems();
    const {mutate: call, isPending} = useInterfaceCall();

    const listError = error
        ? `목록 조회 실패 (${isAxiosError(error) ? error.response?.status ?? "응답 없음" : error.message})`
        : undefined;

    const handleCall = (req: InterfaceCallRequest) => {
        call(req, {
            onSuccess: (result) => {
                setLogs((prev) => [result, ...prev].slice(0, MAX_LOGS));
                const createdId = result.method === "POST" ? createdIdOf(result) : undefined;
                if (createdId) setForm((f) => ({...f, itemId: createdId}));
                if (result.method === "DELETE" && result.status === 204) setForm((f) => ({...f, itemId: ""}));
                if (result.status === 0 || result.status >= 500) {
                    show(`${result.method} ${result.path} 실패 (${result.status || "응답 없음"})`, "error");
                }
            },
        });
    };

    const handleSelect = (item: InterfaceTestItemResponse) =>
        setForm({itemId: item.id, name: item.name, content: item.content ?? "", status: item.status});

    return (
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">인터페이스 테스트</h1>
                <p className="mt-1 text-sm text-slate-500">
                    브라우저 → Next <code className="font-mono">/api/proxy</code> → <code className="font-mono">BACKEND_URL</code>
                    (UMD server → Redis → UMD local) → d94-query → DB 왕복을 메서드별로 확인합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <InterfaceRequestPanel form={form} onChange={setForm} onCall={handleCall} isPending={isPending}/>
                <InterfaceCallLog logs={logs} onClear={() => setLogs([])}/>
            </div>

            <InterfaceItemTable
                items={items}
                isLoading={isLoading}
                errorMessage={listError}
                selectedId={form.itemId}
                onSelect={handleSelect}
                onRefresh={() => refetch()}
            />

            {ToastComponent}
        </div>
    );
}
