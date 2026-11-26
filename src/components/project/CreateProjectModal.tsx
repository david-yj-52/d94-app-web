"use client";

import {useCreateProject} from "@/hooks/useProjects";
import {useProjectTypes} from "@/hooks/useFields";
import {zodResolver} from "@hookform/resolvers/zod";
import Link from "next/link";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const schema = z.object({
    key: z
        .string()
        .trim()
        .toUpperCase()
        .min(2)
        .max(10)
        .regex(/^[A-Z0-9]+$/, "대문자 영문/숫자만 입력 가능합니다."),
    name: z.string().min(1, "프로젝트 이름을 입력해주세요."),
    description: z.string().optional(),
    projectTypeId: z.string().min(1, "프로젝트 타입을 선택해주세요."),
});

type FormData = z.infer<typeof schema>;

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateProjectModal({onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateProject();
    const {data: projectTypes = []} = useProjectTypes();

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {projectTypeId: ""},
    });

    useEffect(() => {
        if (projectTypes.length && !projectTypes.some((t) => t.id === getValues("projectTypeId"))) {
            setValue("projectTypeId", projectTypes[0].id);
        }
    }, [projectTypes, getValues, setValue]);

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
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-d94-brand"
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
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"
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
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-d94-brand"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-slate-600">
                                타입
                            </label>
                            <Link
                                href="/settings?group=cira"
                                onClick={onClose}
                                className="text-[11px] text-d94-brand hover:underline"
                            >
                                기준정보에서 관리
                            </Link>
                        </div>
                        <select
                            {...register("projectTypeId")}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"
                        >
                            {projectTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.typeNm}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-400">
                            타입에 따라 Task가 관리할 필드가 정해집니다.
                        </p>
                        {errors.projectTypeId && (
                            <p className="mt-0.5 text-xs text-red-500">{errors.projectTypeId.message}</p>
                        )}
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
                            className="flex-1 h-10 rounded-lg bg-d94-brand text-white text-sm font-semibold hover:bg-d94-brand-hover disabled:opacity-60"
                        >
                            {isPending ? "생성 중..." : "생성"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
