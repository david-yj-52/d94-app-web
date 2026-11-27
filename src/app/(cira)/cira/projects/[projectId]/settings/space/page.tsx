"use client";

import {useConfirm} from "@/components/ui/ConfirmDialog";
import {useToast} from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import {Input, Select, Textarea} from "@/components/ui/Input";
import {useProjectMembers} from "@/hooks/useProjectSettings";
import {useCurrentSpace, useDeleteSpace, useUpdateSpace} from "@/hooks/useSpaces";
import {isAxiosError} from "axios";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {use, useEffect, useState} from "react";

const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;

/**
 * 작업 공간 설정 › 공간 정보 (설계 1·7.2): 이름·설명은 공간 관리자도, 공간 관리자 임명·삭제는 프로젝트 ADMIN 만(백엔드 검사).
 * 기본 공간·Task 가 남은 공간은 삭제할 수 없다(409 사유를 그대로 보여 준다).
 */
export default function SpaceInfoPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const router = useRouter();
    const {space} = useCurrentSpace(projectId);
    const {data: members = []} = useProjectMembers(projectId);
    const {data: session} = useSession();
    const isAdmin = members.some((m) => m.email === session?.user?.email && m.role === "ADMIN");
    const update = useUpdateSpace(projectId);
    const remove = useDeleteSpace(projectId);
    const {show, ToastComponent} = useToast();
    const {confirm, ConfirmComponent} = useConfirm();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [adminUserId, setAdminUserId] = useState("");

    useEffect(() => {
        if (space) {
            setName(space.name);
            setDescription(space.description ?? "");
            setAdminUserId(space.adminUserId);
        }
    }, [space]);

    if (!space) return null;
    const canEdit = space.canManage;
    const dirty = name.trim() !== space.name || description !== (space.description ?? "") || adminUserId !== space.adminUserId;

    const save = () => update.mutate({
        spaceId: space.id,
        data: {name: name.trim(), description, ...(adminUserId !== space.adminUserId ? {adminUserId} : {})},
    }, {
        onSuccess: () => show("작업 공간 정보를 저장했습니다."),
        onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
    });

    const onDelete = async () => {
        if (!(await confirm(`"${space.name}" 작업 공간을 삭제합니다. 워크플로·필드·보드·산출물 규칙이 함께 지워집니다.`, {confirmLabel: "삭제", danger: true}))) return;
        remove.mutate(space.id, {
            onSuccess: () => router.push(`/cira/projects/${projectId}/settings/space`),
            onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
        });
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">작업 공간 · {space.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                    이 공간의 워크플로·필드·보드·산출물 규칙은 공간 관리자가 따로 운영합니다. 공간을 바꾸려면 사이드바에서 고르세요.
                </p>
            </div>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
                <FormField label="이름">
                    <Input value={name} maxLength={60} disabled={!canEdit} onChange={(e) => setName(e.target.value)}/>
                </FormField>
                <FormField label="설명">
                    <Textarea rows={2} value={description} maxLength={500} disabled={!canEdit} onChange={(e) => setDescription(e.target.value)}/>
                </FormField>
                <FormField label="공간 관리자">
                    <Select value={adminUserId} disabled={!isAdmin} onChange={(e) => setAdminUserId(e.target.value)}>
                        {!members.some((m) => m.userId === space.adminUserId) && <option value={space.adminUserId}>{space.adminNm ?? space.adminUserId}</option>}
                        {members.map((m) => <option key={m.userId} value={m.userId}>{m.userNm} ({m.email})</option>)}
                    </Select>
                </FormField>
                {!isAdmin && <p className="text-xs text-slate-400">공간 관리자 임명·공간 삭제는 프로젝트 관리자만 할 수 있습니다.</p>}
                {canEdit && (
                    <Button type="button" disabled={!dirty || !name.trim() || update.isPending} onClick={save}>저장</Button>
                )}
            </div>
            {isAdmin && (
                <div className="mt-6 rounded-xl border border-red-200 bg-white p-6">
                    <h3 className="mb-1 text-sm font-semibold text-red-700">작업 공간 삭제</h3>
                    <p className="mb-3 text-xs text-slate-500">
                        {space.isDefault ? "기본 작업 공간은 삭제할 수 없습니다." : "Task 가 남아 있으면 삭제할 수 없습니다. 먼저 Task 를 옮기거나 지우세요."}
                    </p>
                    <Button type="button" variant="danger" disabled={space.isDefault || remove.isPending} onClick={onDelete}>삭제</Button>
                </div>
            )}
            {ToastComponent}
            {ConfirmComponent}
        </div>
    );
}
