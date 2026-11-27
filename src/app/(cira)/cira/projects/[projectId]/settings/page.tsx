"use client";

import {useToast} from "@/components/ui/Toast";
import {useDeleteProject, useProject, useUpdateProject} from "@/hooks/useProjects";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "next/navigation";
import {use, useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Textarea} from "@/components/ui/Input";

const schema = z.object({
    name: z.string().min(1, "프로젝트 이름을 입력해주세요."),
    description: z.string().optional(),
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
    const {mutate: updateProject, isPending, isSuccess, isError} =
        useUpdateProject(projectId);
    const {mutate: deleteProject, isPending: isDeleting} = useDeleteProject();
    const {show, ToastComponent} = useToast();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isDirty},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {name: "", description: ""},
    });

    // 프로젝트에는 타입이 없다 (V660): 워크플로·필드는 작업 공간마다, 프리셋은 공간을 만들 때만 고른다
    useEffect(() => {
        if (project) {
            reset({name: project.name, description: project.description ?? ""});
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
                    <Input
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className="mt-0.5 text-xs text-red-500">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        설명
                    </label>
                    <Textarea
                        {...register("description")}
                        rows={3}
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={isPending || !isDirty}
                        className="px-6"
                    >
                        {isPending ? "저장 중..." : "저장"}
                    </Button>
                </div>
            </form>

            <section className="mt-10 max-w-lg rounded-xl border border-red-200 bg-red-50/50 p-5">
                <h3 className="text-sm font-bold text-red-700">위험 구역</h3>
                <p className="mt-1 text-xs text-red-600">
                    프로젝트를 삭제하면 프로젝트 목록에서 제거되며 복구할 수 없습니다.
                </p>
                {!confirmDelete ? (
                    <Button variant="unstyled"
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="mt-4 h-9 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                        프로젝트 삭제
                    </Button>
                ) : (
                    <div className="mt-4 flex items-center gap-2">
                        <Button variant="unstyled"
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {isDeleting ? "삭제 중..." : "정말 삭제"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            disabled={isDeleting}
                            variant="secondary" className="h-9"
                        >
                            취소
                        </Button>
                    </div>
                )}
            </section>

            {ToastComponent}
        </>
    );
}
