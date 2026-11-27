"use client";

import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import {Input, Select} from "@/components/ui/Input";
import {useProjectTypes} from "@/hooks/useFields";
import {useProjectMembers} from "@/hooks/useProjectSettings";
import {useCreateSpace} from "@/hooks/useSpaces";
import type {Space} from "@/types/space";
import {useState} from "react";

/** + 작업 공간 추가 (프로젝트 ADMIN): 이름 · 프리셋(없으면 빈 공간) · 공간 관리자(프로젝트 멤버) */
export default function CreateSpaceModal({projectId, onClose, onCreated}: {
    projectId: string;
    onClose: () => void;
    onCreated?: (space: Space) => void;
}) {
    const {data: types = []} = useProjectTypes();
    const {data: members = []} = useProjectMembers(projectId);
    const create = useCreateSpace(projectId);
    const [name, setName] = useState("");
    const [presetTypeId, setPresetTypeId] = useState("");
    const [adminUserId, setAdminUserId] = useState("");
    const [error, setError] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError("이름을 입력해주세요.");
        create.mutate(
            {name: name.trim(), presetTypeId: presetTypeId || null, adminUserId: adminUserId || null},
            {
                onSuccess: (s) => {
                    onCreated?.(s);
                    onClose();
                },
                onError: () => setError("작업 공간을 만들지 못했습니다. 같은 이름이 있는지 확인하세요."),
            },
        );
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title="작업 공간 추가">
            <form onSubmit={submit} className="space-y-4 p-4">
                <FormField label="이름" required>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hardware" maxLength={60} autoFocus/>
                </FormField>
                <FormField label="프리셋">
                    <Select value={presetTypeId} onChange={(e) => setPresetTypeId(e.target.value)}>
                        <option value="" title="To Do → In Progress → Done">빈 공간</option>
                        {types.map((t) => <option key={t.id} value={t.id}>{t.typeNm}</option>)}
                    </Select>
                    <p className="mt-1 text-xs text-slate-400">프리셋의 상태·필드·보드를 1회 복사합니다. 이후 공간 관리자가 자유롭게 바꿉니다.</p>
                </FormField>
                <FormField label="공간 관리자">
                    <Select value={adminUserId} onChange={(e) => setAdminUserId(e.target.value)}>
                        <option value="">나</option>
                        {members.map((m) => <option key={m.userId} value={m.userId}>{m.userNm ?? m.email}</option>)}
                    </Select>
                </FormField>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
                    <Button type="submit" className="flex-1" disabled={create.isPending}>
                        {create.isPending ? "만드는 중..." : "추가"}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
