"use client";

import {useCreateBoard} from "@/hooks/useBoards";
import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Select} from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

const schema = z.object({
    boardNm: z.string().min(1, "보드 이름을 입력해주세요.").max(100),
    boardType: z.enum(["KANBAN", "SCRUM"]),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    /** 보드를 만들 작업 공간 (없으면 기본 공간) */
    spaceId?: string;
    onClose: () => void;
    onSuccess?: (boardId: string) => void;
}

export default function CreateBoardModal({
                                             projectId,
                                             spaceId,
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
        defaultValues: {boardNm: "기본 보드", boardType: "KANBAN"},
    });

    useEffect(() => {
        if (data) {
            onSuccess?.(data.id);
            onClose();
        }
    }, [data, onClose, onSuccess]);

    const onSubmit = (formData: FormData) => {
        mutate({boardNm: formData.boardNm, boardType: formData.boardType, spaceId});
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">보드 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="보드 이름" required error={errors.boardNm?.message}>
                        <Input
                            {...register("boardNm")}
                            placeholder="예: 개발 보드"
                        />
                    </FormField>

                    <FormField label="보드 유형">
                        <Select {...register("boardType")}>
                            <option value="KANBAN">칸반 (전체 Task)</option>
                            <option value="SCRUM">스크럼 (활성 스프린트 Task)</option>
                        </Select>
                    </FormField>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            보드 생성에 실패했습니다.
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
