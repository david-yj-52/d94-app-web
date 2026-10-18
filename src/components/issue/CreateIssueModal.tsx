"use client";

import {useCreateIssue} from "@/hooks/useIssues";
import type {Priority} from "@/types/issue";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const PRIORITIES: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

const schema = z.object({
    title: z
        .string()
        .min(1, "제목을 입력해주세요.")
        .max(500, "제목은 500자 이내로 입력해주세요."),
    content: z.string().optional(),
    priority: z.enum(["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"]).optional(),
    assigneeId: z.string().optional(),
    storyPnt: z.number().min(0).optional(),
    dueDt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateIssueModal({
                                             projectId,
                                             onClose,
                                             onSuccess,
                                         }: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateIssue(projectId);

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
            title: data.title,
            content: data.content || undefined,
            priority: data.priority,
            assigneeId: data.assigneeId || undefined,
            storyPnt: data.storyPnt,
            dueDt: data.dueDt || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">이슈 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("title")}
                            placeholder="이슈 제목을 입력하세요"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.title && (
                            <p className="mt-0.5 text-xs text-red-500">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            설명
                        </label>
                        <textarea
                            {...register("content")}
                            rows={4}
                            placeholder="이슈 설명을 입력하세요..."
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                우선순위
                            </label>
                            <select
                                {...register("priority")}
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">선택 안 함</option>
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                스토리 포인트
                            </label>
                            <input
                                {...register("storyPnt", {valueAsNumber: true})}
                                type="number"
                                min={0}
                                placeholder="0"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                담당자 이메일
                            </label>
                            <input
                                {...register("assigneeId")}
                                type="email"
                                placeholder="담당자 이메일"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                마감일
                            </label>
                            <input
                                {...register("dueDt")}
                                type="date"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            이슈 생성에 실패했습니다.
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
                            {isPending ? "생성 중..." : "이슈 생성"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
