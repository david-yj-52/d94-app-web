"use client";

import {useToast} from "@/components/ui/Toast";
import {useProject, useUpdateProject} from "@/hooks/useProjects";
import {use, useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";

const schema = z.object({
    name: z.string().min(1, "프로젝트 이름을 입력해주세요."),
    description: z.string().optional(),
    projectType: z.enum(["SCRUM", "KANBAN"]),
});

type FormData = z.infer<typeof schema>;

export default function SettingsGeneralPage({
                                                params,
                                            }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: project, isLoading} = useProject(projectId);
    const {mutate: updateProject, isPending, isSuccess, isError} =
        useUpdateProject(projectId);
    const {show, ToastComponent} = useToast();

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isDirty},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {name: "", description: "", projectType: "SCRUM"},
    });

    useEffect(() => {
        if (project) {
            reset({
                name: project.name,
                description: project.description ?? "",
                projectType: project.projectType,
            });
        }
    }, [project, reset]);

    useEffect(() => {
        if (isSuccess) show("프로젝트 정보가 저장되었습니다.");
    }, [isSuccess, show]);

    useEffect(() => {
        if (isError) show("저장에 실패했습니다.", "error");
    }, [isError, show]);

    const onSubmit = (data: FormData) => updateProject(data);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse"/>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">기본 정보</h2>
                <p className="text-sm text-slate-500 mt-1">프로젝트의 기본 설정을 관리합니다.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        프로젝트 키
                    </label>
                    <div
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-500 font-mono">
                        {project?.key ?? "-"}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">프로젝트 키는 변경할 수 없습니다.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        프로젝트 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register("name")}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                        <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        설명
                    </label>
                    <textarea
                        {...register("description")}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        프로젝트 유형
                    </label>
                    <select
                        {...register("projectType")}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="SCRUM">Scrum</option>
                        <option value="KANBAN">Kanban</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isPending || !isDirty}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {isPending ? "저장 중..." : "저장"}
                    </button>
                </div>
            </form>

            {ToastComponent}
        </>
    );
}
