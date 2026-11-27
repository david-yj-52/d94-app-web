"use client";

import {useCreateSprint} from "@/hooks/useSprints";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Textarea} from "@/components/ui/Input";

const schema = z.object({
    sprintNm: z.string().min(1, "스프린트 이름을 입력해주세요.").max(100),
    goal: z.string().optional(),
    startDt: z.string().optional(),
    endDt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateSprintModal({projectId, onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateSprint(projectId);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => {
        mutate({
            sprintNm: data.sprintNm,
            goal: data.goal || undefined,
            startDt: data.startDt || undefined,
            endDt: data.endDt || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">스프린트 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            스프린트 이름 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            {...register("sprintNm")}
                            placeholder="예: Sprint 1"
                        />
                        {errors.sprintNm && (
                            <p className="mt-0.5 text-xs text-red-500">{errors.sprintNm.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            스프린트 목표
                        </label>
                        <Textarea
                            {...register("goal")}
                            rows={2}
                            placeholder="이 스프린트에서 달성할 목표를 입력하세요"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                시작일
                            </label>
                            <Input
                                {...register("startDt")}
                                type="date"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                종료일
                            </label>
                            <Input
                                {...register("endDt")}
                                type="date"
                            />
                        </div>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            스프린트 생성에 실패했습니다.
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
                            {isPending ? "생성 중..." : "생성"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
