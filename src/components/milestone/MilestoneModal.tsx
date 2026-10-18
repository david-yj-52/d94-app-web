"use client";

import {useCreateMilestone, useUpdateMilestone} from "@/hooks/useMilestones";
import type {MilestoneResponse} from "@/types/milestone";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const schema = z.object({
    name: z.string().min(1, "마일스톤 이름을 입력해주세요.").max(100),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(["OPEN", "CLOSED"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    editTarget?: MilestoneResponse | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function MilestoneModal({projectId, editTarget, onClose, onSuccess}: Props) {
    const isEdit = !!editTarget;

    const {
        mutate: create,
        isPending: isCreating,
        isSuccess: createSuccess,
        isError: createError,
    } = useCreateMilestone(projectId);
    const {
        mutate: update,
        isPending: isUpdating,
        isSuccess: updateSuccess,
        isError: updateError,
    } = useUpdateMilestone(projectId);

    const isPending = isCreating || isUpdating;
    const isSuccess = createSuccess || updateSuccess;
    const isError = createError || updateError;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: editTarget?.name ?? "",
            description: editTarget?.description ?? "",
            dueDate: editTarget?.dueDate ?? "",
            status: editTarget?.status ?? "OPEN",
        },
    });

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => {
        const payload = {
            name: data.name,
            description: data.description || undefined,
            dueDate: data.dueDate || undefined,
            status: data.status,
        };

        if (isEdit && editTarget) {
            update({milestoneId: editTarget.id, data: payload});
        } else {
            create(payload);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">
                    {isEdit ? "마일스톤 수정" : "마일스톤 생성"}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            마일스톤 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("name")}
                            placeholder="예: MVP 출시"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.name && (
                            <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">설명</label>
                        <textarea
                            {...register("description")}
                            rows={2}
                            placeholder="마일스톤에 대한 설명을 입력하세요"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">마감일</label>
                        <input
                            {...register("dueDate")}
                            type="date"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">상태</label>
                        <select
                            {...register("status")}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="OPEN">진행 중</option>
                            <option value="CLOSED">완료</option>
                        </select>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            {isEdit ? "마일스톤 수정에 실패했습니다." : "마일스톤 생성에 실패했습니다."}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isPending ? (isEdit ? "수정 중..." : "생성 중...") : isEdit ? "수정" : "생성"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
