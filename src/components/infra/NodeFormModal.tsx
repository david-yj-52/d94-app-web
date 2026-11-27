"use client";

import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import {Input, Select, Textarea} from "@/components/ui/Input";
import {useSaveInfraNode} from "@/hooks/useInfra";
import {emptyNode, type InfraNode, LOCATION_LABEL, NODE_TYPE_LABEL, STATUS_LABEL} from "@/types/infra";
import {useState} from "react";
import {infraError} from "./format";

type NumKey = "cpuCores" | "memoryTotalMb" | "gpuMemoryMb" | "diskTotalGb" | "sshPort";
type TextKey = "osInfo" | "cpuModel" | "gpuModel" | "hostLabel" | "sshAlias" | "sshUser" | "sshKeyHint";

const SPEC_FIELDS: [TextKey | NumKey, string][] = [
    ["osInfo", "OS"], ["cpuModel", "CPU 모델"], ["cpuCores", "CPU 코어"], ["memoryTotalMb", "RAM (MB)"],
    ["gpuModel", "GPU 모델"], ["gpuMemoryMb", "GPU 메모리 (MB)"], ["diskTotalGb", "디스크 (GB)"],
];
const ACCESS_FIELDS: [TextKey | NumKey, string][] = [
    ["hostLabel", "호스트 표시"], ["sshAlias", "SSH 별칭"], ["sshUser", "SSH 사용자"], ["sshPort", "SSH 포트"],
    ["sshKeyHint", "키 파일 경로 힌트"],
];
const NUM_KEYS = new Set<string>(["cpuCores", "memoryTotalMb", "gpuMemoryMb", "diskTotalGb", "sshPort"]);

/** 노드 등록·수정. initial 이 있으면 수정(키는 바꿀 수 없음). 비밀번호·개인키는 받지 않는다 */
export default function NodeFormModal({initial, onClose, onSaved}: {
    initial?: InfraNode;
    onClose: () => void;
    onSaved?: (nodeKey: string) => void;
}) {
    const [node, setNode] = useState<InfraNode>(initial ?? emptyNode());
    const [error, setError] = useState("");
    const save = useSaveInfraNode();
    const set = (patch: Partial<InfraNode>) => setNode((n) => ({...n, ...patch}));

    const field = ([key, label]: [TextKey | NumKey, string]) => (
        <FormField key={key} label={label}>
            <Input type={NUM_KEYS.has(key) ? "number" : "text"} value={node[key] ?? ""}
                   placeholder={key === "sshKeyHint" ? "~/.ssh/delap" : key === "sshAlias" ? "delap" : undefined}
                   onChange={(e) => set({[key]: e.target.value === "" ? null : NUM_KEYS.has(key) ? Number(e.target.value) : e.target.value})}/>
        </FormField>
    );

    const submit = () => {
        setError("");
        save.mutate({node, originalKey: initial?.nodeKey}, {
            onSuccess: (s) => {
                onSaved?.(s.node.nodeKey);
                onClose();
            },
            onError: (e) => setError(infraError(e, "저장하지 못했습니다.")),
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title={initial ? "노드 수정" : "노드 등록"}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <FormField label="노드 키" required>
                        <Input value={node.nodeKey} disabled={!!initial} placeholder="jetson-01"
                               onChange={(e) => set({nodeKey: e.target.value.trim()})}/>
                    </FormField>
                    <FormField label="이름">
                        <Input value={node.name} onChange={(e) => set({name: e.target.value})}/>
                    </FormField>
                    <FormField label="유형">
                        <Select value={node.nodeType} onChange={(e) => set({nodeType: e.target.value as InfraNode["nodeType"]})}>
                            {Object.entries(NODE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="위치">
                        <Select value={node.location} onChange={(e) => set({location: e.target.value as InfraNode["location"]})}>
                            {Object.entries(LOCATION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </FormField>
                    <FormField label="상태">
                        <Select value={node.status} onChange={(e) => set({status: e.target.value as InfraNode["status"]})}>
                            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </FormField>
                </div>
                <h3 className="text-sm font-semibold text-slate-700">하드웨어 스펙</h3>
                <div className="grid grid-cols-2 gap-3">{SPEC_FIELDS.map(field)}</div>
                <h3 className="text-sm font-semibold text-slate-700">접속 가이드 <span className="font-normal text-slate-400">(비밀번호·개인키는 적지 마세요)</span></h3>
                <div className="grid grid-cols-2 gap-3">{ACCESS_FIELDS.map(field)}</div>
                <FormField label="메모">
                    <Textarea rows={3} value={node.accessNotes ?? ""} onChange={(e) => set({accessNotes: e.target.value || null})}/>
                </FormField>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
                    <Button type="button" className="flex-1" disabled={!node.nodeKey || save.isPending} onClick={submit}>저장</Button>
                </div>
            </div>
        </Dialog>
    );
}
