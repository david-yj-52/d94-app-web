"use client";

import {useUpdateSprint} from "@/hooks/useSprints";
import type {SprintResponse} from "@/types/sprint";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Textarea} from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

const schema = z.object({
    sprintNm: z.string().min(1, "스프린트 이름을 입력해주세요.").max(100),
    goal: z.string().optional(),
    startDt: z.string().optional(),
    endDt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    sprint: SprintResponse;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function EditSprintModal({projectId, sprint, onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useUpdateSprint(projectId);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            sprintNm: sprint.sprintNm,
            goal: sprint.goal ?? "",
            startDt: sprint.startDt ?? "",
            endDt: sprint.endDt ?? "",
        },
    });

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => {
        mutate({
            sprintId: sprint.id,
            data: {
                sprintNm: data.sprintNm,
                goal: data.goal || undefined,
                startDt: data.startDt || undefined,
                endDt: data.endDt || undefined,
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">스프린트 수정</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="스프린트 이름" required error={errors.sprintNm?.message}>
                        <Input
                            {...register("sprintNm")}
                        />
                    </FormField>

                    <FormField label="스프린트 목표">
                        <Textarea
                            {...register("goal")}
                            rows={2}
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="시작일">
                            <Input
                                {...register("startDt")}
                                type="date"
                            />
                        </FormField>
                        <FormField label="종료일">
                            <Input
                                {...register("endDt")}
                                type="date"
                            />
                        </FormField>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            스프린트 수정에 실패했습니다.
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
                            {isPending ? "수정 중..." : "수정"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
