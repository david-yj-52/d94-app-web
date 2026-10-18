"use client";

import {useCreateBoard} from "@/hooks/useBoards";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";

const schema = z.object({
    boardNm: z.string().min(1, "보드 이름을 입력해주세요.").max(100),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    onClose: () => void;
    onSuccess?: (boardId: string) => void;
}

export default function CreateBoardModal({
                                             projectId,
                                             onClose,
                                             onSuccess,
                                         }: Props) {
    const {mutate, isPending, isError, data} = useCreateBoard(projectId);

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {boardNm: "기본 보드"},
    });

    useEffect(() => {
        if (data) {
            onSuccess?.(data.id);
            onClose();
        }
    }, [data, onClose, onSuccess]);

    const onSubmit = (formData: FormData) => {
        mutate({boardNm: formData.boardNm, boardType: "KANBAN"});
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">보드 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            보드 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("boardNm")}
                            placeholder="예: 개발 보드"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.boardNm && (
                            <p className="mt-0.5 text-xs text-red-500">
                                {errors.boardNm.message}
                            </p>
                        )}
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            보드 생성에 실패했습니다.
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
