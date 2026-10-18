"use client";

import {useAddColumn, useUpdateColumn} from "@/hooks/useBoards";
import type {BoardColumnResponse} from "@/types/board";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";

const schema = z.object({
    columnNm: z.string().min(1, "컬럼 이름을 입력해주세요."),
    statusId: z.string().min(1, "상태 ID를 입력해주세요."),
    wipLimitStr: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    boardId: string;
    editingColumn?: BoardColumnResponse;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddColumnModal({
                                           boardId,
                                           editingColumn,
                                           onClose,
                                           onSuccess,
                                       }: Props) {
    const isEdit = !!editingColumn;

    const {
        mutate: addCol,
        isPending: addPending,
        isSuccess: addSuccess,
        isError: addError,
    } = useAddColumn(boardId);
    const {
        mutate: updateCol,
        isPending: updatePending,
        isSuccess: updateSuccess,
        isError: updateError,
    } = useUpdateColumn(boardId);

    const isPending = addPending || updatePending;
    const isSuccess = addSuccess || updateSuccess;
    const isError = addError || updateError;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            columnNm: editingColumn?.columnNm ?? "",
            statusId: editingColumn?.statusId ?? "",
            wipLimitStr: editingColumn?.wipLimit != null
                ? String(editingColumn.wipLimit)
                : "",
        },
    });

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => {
        const wipLimit = data.wipLimitStr
            ? parseInt(data.wipLimitStr, 10) || undefined
            : undefined;

        if (isEdit && editingColumn) {
            updateCol({
                columnId: editingColumn.id,
                data: {columnNm: data.columnNm, wipLimit},
            });
        } else {
            addCol({columnNm: data.columnNm, statusId: data.statusId, wipLimit});
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-5">
                    {isEdit ? "컬럼 편집" : "컬럼 추가"}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            컬럼 이름 <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("columnNm")}
                            placeholder="예: In Review"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.columnNm && (
                            <p className="mt-0.5 text-xs text-red-500">
                                {errors.columnNm.message}
                            </p>
                        )}
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                상태 ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("statusId")}
                                placeholder="이슈 상태 ID"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-0.5 text-[10px] text-slate-400">
                                프로젝트 워크플로우의 상태 ID를 입력하세요.
                            </p>
                            {errors.statusId && (
                                <p className="mt-0.5 text-xs text-red-500">
                                    {errors.statusId.message}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            WIP 제한 (선택)
                        </label>
                        <input
                            {...register("wipLimitStr")}
                            type="number"
                            min={1}
                            placeholder="제한 없음"
                            className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            저장에 실패했습니다.
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
                            {isPending ? "저장 중..." : isEdit ? "저장" : "추가"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
