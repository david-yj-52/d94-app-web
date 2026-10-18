"use client";

import {useAddProjectMember} from "@/hooks/useProjectSettings";
import type {ProjectRole} from "@/types/member";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";

const schema = z.object({
    email: z.string().email("유효한 이메일을 입력해주세요."),
    role: z.enum(["ADMIN", "MEMBER"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddMemberModal({projectId, onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useAddProjectMember(projectId);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {role: "MEMBER"},
    });

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) =>
        mutate({email: data.email, role: data.role as ProjectRole});

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">멤버 추가</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            이메일
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            placeholder="user@example.com"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.email && (
                            <p className="mt-0.5 text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            역할
                        </label>
                        <select
                            {...register("role")}
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            멤버 추가에 실패했습니다. 이메일을 확인해주세요.
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
                            {isPending ? "추가 중..." : "추가"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
