"use client";

import {useCreateProject} from "@/hooks/useProjects";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const schema = z.object({
    key: z
        .string()
        .min(2)
        .max(10)
        .regex(/^[A-Z0-9]+$/, "대문자 영문/숫자만 입력 가능합니다.")
        .transform((v) => v.toUpperCase()),
    name: z.string().min(1, "프로젝트 이름을 입력해주세요."),
    description: z.string().optional(),
    projectType: z.enum(["SCRUM", "KANBAN"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateProjectModal({onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateProject();

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {projectType: "SCRUM"},
    });

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => mutate(data);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">프로젝트 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                키 (Key)
                            </label>
                            <input
                                {...register("key")}
                                placeholder="PROJ"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors.key && (
                                <p className="mt-0.5 text-xs text-red-500">
                                    {errors.key.message}
                                </p>
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                이름
                            </label>
                            <input
                                {...register("name")}
                                placeholder="프로젝트 이름"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {errors.name && (
                                <p className="mt-0.5 text-xs text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            설명 (선택)
                        </label>
                        <textarea
                            {...register("description")}
                            rows={2}
                            placeholder="프로젝트 설명"
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            유형
                        </label>
                        <select
                            {...register("projectType")}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="SCRUM">Scrum</option>
                            <option value="KANBAN">Kanban</option>
                        </select>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            프로젝트 생성에 실패했습니다.
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
                            {isPending ? "생성 중..." : "생성"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
