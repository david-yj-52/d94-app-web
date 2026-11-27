"use client";

import {useCreateProject} from "@/hooks/useProjects";
import {useProjectTypes} from "@/hooks/useFields";
import {zodResolver} from "@hookform/resolvers/zod";
import {Plus, X} from "lucide-react";
import Link from "next/link";
import {useEffect} from "react";
import {useFieldArray, useForm} from "react-hook-form";
import {z} from "zod";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
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
        <Dialog open onOpenChange={(o) => !o && onClose()} title="프로젝트 생성">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
                <div className="grid grid-cols-3 gap-3">
                    <FormField label="키 (Key)" required error={errors.key?.message}>
                        <Input {...register("key")} placeholder="PROJ" className="uppercase"/>
                    </FormField>
                    <FormField label="이름" required error={errors.name?.message} className="col-span-2">
                        <Input {...register("name")} placeholder="프로젝트 이름"/>
                    </FormField>
                </div>

                <FormField label="설명">
                    <Textarea {...register("description")} rows={2} placeholder="프로젝트 설명"/>
                </FormField>

                <fieldset>
                    <div className="mb-1 flex items-center justify-between">
                        <legend className="text-xs font-medium text-slate-600">작업 공간 구성</legend>
                        <Link href="/settings?group=cira" onClick={onClose} className="text-xs text-d94-brand hover:underline">프리셋 관리</Link>
                    </div>
                    <p className="mb-2 text-xs text-slate-400">
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
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center" title="Task 를 처음 등록하는 공간">
                                        <Badge>기본</Badge>
                                    </span>
                                ) : (
                                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10" aria-label={`작업 공간 ${i + 1} 빼기`} onClick={() => remove(i)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                    {errors.spaces?.root?.message && <p className="mt-1 text-xs text-red-500">{errors.spaces.root.message}</p>}
                    {errors.spaces?.message && <p className="mt-1 text-xs text-red-500">{errors.spaces.message}</p>}
                    <Button type="button" variant="secondary" size="sm" className="mt-2" disabled={fields.length >= MAX_SPACES}
                            onClick={() => append({name: "", presetTypeId: ""})}>
                        <Plus className="h-4 w-4"/>작업 공간 추가
                    </Button>
                </fieldset>

                {isError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">프로젝트 생성에 실패했습니다.</p>}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
                    <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "생성 중..." : "생성"}</Button>
                </div>
            </form>
        </Dialog>
    );
}
