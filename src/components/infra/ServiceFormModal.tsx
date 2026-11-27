"use client";

import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import {Input, Select, Textarea} from "@/components/ui/Input";
import {useSaveInfraService} from "@/hooks/useInfra";
import {type InfraService, SERVICE_KIND_LABEL} from "@/types/infra";
import {useState} from "react";
import {infraError} from "./format";

const EMPTY: InfraService = {
    id: null, nodeId: null, name: "", kind: "DOCKER", portsText: null, endpointUrl: null, composePath: null,
    estimatedMemMb: null, description: null,
};

/** 노드 위 서비스 문서 등록·수정 */
export default function ServiceFormModal({nodeKey, initial, onClose}: {
    nodeKey: string;
    initial?: InfraService;
    onClose: () => void;
}) {
    const [svc, setSvc] = useState<InfraService>(initial ?? EMPTY);
    const [error, setError] = useState("");
    const save = useSaveInfraService(nodeKey);
    const set = (patch: Partial<InfraService>) => setSvc((s) => ({...s, ...patch}));
    const text = (key: "portsText" | "endpointUrl" | "composePath", label: string) => (
        <FormField label={label}>
            <Input value={svc[key] ?? ""} onChange={(e) => set({[key]: e.target.value || null})}/>
        </FormField>
    );

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title={initial ? "서비스 수정" : "서비스 추가"}>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="이름" required>
                        <Input value={svc.name} onChange={(e) => set({name: e.target.value})}/>
                    </FormField>
                    <FormField label="종류">
                        <Select value={svc.kind} onChange={(e) => set({kind: e.target.value as InfraService["kind"]})}>
                            {Object.entries(SERVICE_KIND_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </FormField>
                    {text("portsText", "포트")}
                    <FormField label="예상 메모리 (MB)">
                        <Input type="number" value={svc.estimatedMemMb ?? ""}
                               onChange={(e) => set({estimatedMemMb: e.target.value === "" ? null : Number(e.target.value)})}/>
                    </FormField>
                </div>
                {text("endpointUrl", "엔드포인트 URL")}
                {text("composePath", "compose 경로")}
                <FormField label="설명">
                    <Textarea rows={3} value={svc.description ?? ""} onChange={(e) => set({description: e.target.value || null})}/>
                </FormField>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
                    <Button type="button" className="flex-1" disabled={!svc.name || save.isPending}
                            onClick={() => save.mutate(svc, {onSuccess: onClose, onError: (e) => setError(infraError(e, "저장하지 못했습니다."))})}>
                        저장
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
