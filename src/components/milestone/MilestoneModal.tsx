"use client";

import {useCreateMilestone, useUpdateMilestone} from "@/hooks/useMilestones";
import type {MilestoneResponse} from "@/types/milestone";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Select, Textarea} from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

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
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">
                    {isEdit ? "마일스톤 수정" : "마일스톤 생성"}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="마일스톤 이름" required error={errors.name?.message}>
                        <Input
                            {...register("name")}
                            placeholder="예: MVP 출시"
                        />
                    </FormField>

                    <FormField label="설명">
                        <Textarea
                            {...register("description")}
                            rows={2}
                            placeholder="마일스톤에 대한 설명을 입력하세요"
                        />
                    </FormField>

                    <FormField label="마감일">
                        <Input
                            {...register("dueDate")}
                            type="date"
                        />
                    </FormField>

                    <FormField label="상태">
                        <Select
                            {...register("status")}
                        >
                            <option value="OPEN">진행 중</option>
                            <option value="CLOSED">완료</option>
                        </Select>
                    </FormField>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            {isEdit ? "마일스톤 수정에 실패했습니다." : "마일스톤 생성에 실패했습니다."}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary" className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? (isEdit ? "수정 중..." : "생성 중...") : isEdit ? "수정" : "생성"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
