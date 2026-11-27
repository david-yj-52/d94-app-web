"use client";

import {useCreateProject} from "@/hooks/useProjects";
import {useProjectTypes} from "@/hooks/useFields";
import {zodResolver} from "@hookform/resolvers/zod";
import {Plus, X} from "lucide-react";
import Link from "next/link";
import {useEffect} from "react";
import {useFieldArray, useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Select, Textarea} from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

const MAX_SPACES = 10;

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
    /** 처음 만들 작업 공간들. 첫 번째 = 기본 공간. presetTypeId "" = 빈 공간 */
    spaces: z.array(z.object({
        name: z.string().trim().min(1, "공간 이름을 입력해주세요.").max(60),
        presetTypeId: z.string(),
    })).min(1).max(MAX_SPACES)
        .refine((rows) => new Set(rows.map((r) => r.name.trim())).size === rows.length, "작업 공간 이름이 겹칩니다."),
});

type FormData = z.infer<typeof schema>;

interface Props {
    onClose: () => void;
    onSuccess?: () => void;
}

/**
 * 프로젝트 생성 (V650·V660): 프로젝트에는 타입이 없다. 대신 처음 작업 공간들(예: Hardware · Software · 별도 공간)을
 * 여기서 한 번에 구성하고, 공간마다 프리셋(상태·필드·보드 1회 복사) 또는 빈 공간을 고른다.
 */
export default function CreateProjectModal({onClose, onSuccess}: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateProject();
    const {data: presets = []} = useProjectTypes();

    const {
        register,
        handleSubmit,
        control,
        formState: {errors},
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {spaces: [{name: "General", presetTypeId: ""}]},
    });
    const {fields, append, remove} = useFieldArray({control, name: "spaces"});

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => mutate({
        key: data.key,
        name: data.name,
        description: data.description,
        spaces: data.spaces.map((s) => ({name: s.name.trim(), presetTypeId: s.presetTypeId || null})),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">프로젝트 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <FormField label="키 (Key)" error={errors.key?.message}>
                            <input
                                {...register("key")}
                                placeholder="PROJ"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-d94-brand"
                            />
                        </FormField>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                이름
                            </label>
                            <Input
                                {...register("name")}
                                placeholder="프로젝트 이름"
                            />
                            {errors.name && (
                                <p className="mt-0.5 text-xs text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <FormField label="설명 (선택)">
                        <Textarea
                            {...register("description")}
                            rows={2}
                            placeholder="프로젝트 설명"
                        />
                    </FormField>

                    <fieldset>
                        <div className="flex items-center justify-between mb-1">
                            <legend className="block text-xs font-medium text-slate-600">작업 공간 구성</legend>
                            <Link href="/settings?group=cira" onClick={onClose} className="text-[11px] text-d94-brand hover:underline">
                                프리셋 관리
                            </Link>
                        </div>
                        <p className="mb-2 text-[11px] text-slate-400">
                            팀·영역마다 공간을 나눕니다(예: Hardware · Software · 별도 공간). 공간마다 워크플로·필드·보드를 따로 운영하고,
                            프리셋을 고르면 그 상태·필드·보드가 한 번 복사됩니다. 공간 관리자는 만든 뒤 지정합니다.
                        </p>
                        <ul className="space-y-2">
                            {fields.map((f, i) => (
                                <li key={f.id} className="flex items-start gap-2">
                                    <div className="grid flex-1 grid-cols-2 gap-2">
                                        <div>
                                            <Input {...register(`spaces.${i}.name`)} placeholder="공간 이름" aria-label={`작업 공간 ${i + 1} 이름`}/>
                                            {errors.spaces?.[i]?.name && (
                                                <p className="mt-0.5 text-xs text-red-500">{errors.spaces[i]?.name?.message}</p>
                                            )}
                                        </div>
                                        <Select {...register(`spaces.${i}.presetTypeId`)} aria-label={`작업 공간 ${i + 1} 프리셋`}>
                                            <option value="" title="To Do → In Progress → Done">빈 공간</option>
                                            {presets.map((t) => <option key={t.id} value={t.id}>{t.typeNm}</option>)}
                                        </Select>
                                    </div>
                                    {i === 0 ? (
                                        <span className="mt-2.5 w-9 shrink-0 text-center text-[11px] text-slate-400" title="Task 를 처음 등록하는 공간">기본</span>
                                    ) : (
                                        <Button type="button" variant="ghost" size="icon" aria-label={`작업 공간 ${i + 1} 빼기`} onClick={() => remove(i)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {errors.spaces?.root?.message && <p className="mt-1 text-xs text-red-500">{errors.spaces.root.message}</p>}
                        {errors.spaces?.message && <p className="mt-1 text-xs text-red-500">{errors.spaces.message}</p>}
                        <Button type="button" variant="link" size="sm" className="mt-2" disabled={fields.length >= MAX_SPACES}
                                onClick={() => append({name: "", presetTypeId: ""})}>
                            <Plus className="h-3.5 w-3.5"/>작업 공간 추가
                        </Button>
                    </fieldset>

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            프로젝트 생성에 실패했습니다.
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
