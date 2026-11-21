"use client";

import {useToast} from "@/components/ui/Toast";
import {useDeleteProject, useProject, useUpdateProject} from "@/hooks/useProjects";
import {useSettings} from "@/hooks/useSettings";
import {CIRA_PROJECT_TYPES_KEY, DEFAULT_CIRA_PROJECT_TYPES, parseCiraProjectTypes} from "@/types/settings";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {use, useEffect, useMemo, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const schema = z.object({
    name: z.string().min(1, "프로젝트 이름을 입력해주세요."),
    description: z.string().optional(),
    projectType: z.string().min(1, "프로젝트 유형을 선택해주세요.").max(30),
});

type FormData = z.infer<typeof schema>;

export default function SettingsGeneralPage({
                                                params,
                                            }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const router = useRouter();
    const {data: project, isLoading} = useProject(projectId);
    const {data: settings} = useSettings();
    const {mutate: updateProject, isPending, isSuccess, isError} =
        useUpdateProject(projectId);
    const {mutate: deleteProject, isPending: isDeleting} = useDeleteProject();
    const {show, ToastComponent} = useToast();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const projectTypes = useMemo(() => {
        const configured = parseCiraProjectTypes(settings?.[CIRA_PROJECT_TYPES_KEY]);
        const base = configured.length > 0 ? configured : DEFAULT_CIRA_PROJECT_TYPES;
        if (project?.projectType && !base.includes(project.projectType)) {
            return [project.projectType, ...base];
        }
        return base;
    }, [settings, project?.projectType]);

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isDirty},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {name: "", description: "", projectType: projectTypes[0]},
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

    const handleDelete = () => {
        deleteProject(projectId, {
            onSuccess: () => {
                router.push("/cira/projects");
            },
            onError: () => {
                show("프로젝트 삭제에 실패했습니다.", "error");
                setConfirmDelete(false);
            },
        });
    };

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
                        {projectTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
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

            <section className="mt-10 max-w-lg rounded-xl border border-red-200 bg-red-50/50 p-5">
                <h3 className="text-sm font-bold text-red-700">위험 구역</h3>
                <p className="mt-1 text-xs text-red-600">
                    프로젝트를 삭제하면 프로젝트 목록에서 제거되며 복구할 수 없습니다.
                </p>
                {!confirmDelete ? (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="mt-4 h-9 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                        프로젝트 삭제
                    </button>
                ) : (
                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {isDeleting ? "삭제 중..." : "정말 삭제"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            disabled={isDeleting}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            취소
                        </button>
                    </div>
                )}
            </section>

            {ToastComponent}
        </>
    );
}
