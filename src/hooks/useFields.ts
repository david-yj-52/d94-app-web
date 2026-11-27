"use client";

import {
    createGlobalField,
    createProjectField,
    createProjectType,
    createTypeField,
    deleteTypeField,
    getFieldLibrary,
    importToProject,
    importToType,
    updateTypeField,
    deleteGlobalField,
    deleteProjectField,
    deleteProjectType,
    getColumnPref,
    getFieldCatalog,
    getFieldUsage,
    getProjectFields,
    getProjectTypes,
    replaceProjectFields,
    replaceProjectTypeFields,
    resetColumnPref,
    saveColumnPref,
    updateGlobalField,
    updateProjectField,
    updateProjectType,
} from "@/lib/api/fields";
import type {SaveCustomField, SaveProjectType, TypeField} from "@/types/fields";
import {type QueryClient, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

// 타입 세트·전역 필드가 바뀌면 모든 프로젝트의 유효 필드·컬럼이 바뀐다
const invalidateAll = (qc: QueryClient) => {
    qc.invalidateQueries({queryKey: ["project-types"]});
    qc.invalidateQueries({queryKey: ["field-catalog"]});
    qc.invalidateQueries({queryKey: ["project-fields"]});
    qc.invalidateQueries({queryKey: ["column-pref"]});
    qc.invalidateQueries({queryKey: ["issues"]});
};

export function useFieldCatalog() {
    return useQuery({queryKey: ["field-catalog"], queryFn: getFieldCatalog});
}

export function useProjectTypes() {
    return useQuery({queryKey: ["project-types"], queryFn: getProjectTypes});
}

export function useCreateProjectType() {
    const qc = useQueryClient();
    return useMutation({mutationFn: (d: SaveProjectType) => createProjectType(d), onSuccess: () => invalidateAll(qc)});
}

export function useUpdateProjectType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, data}: { id: string; data: SaveProjectType }) => updateProjectType(id, data),
        onSuccess: () => {
            invalidateAll(qc);
            qc.invalidateQueries({queryKey: ["projects"]});
        },
    });
}

export function useDeleteProjectType() {
    const qc = useQueryClient();
    return useMutation({mutationFn: (id: string) => deleteProjectType(id), onSuccess: () => invalidateAll(qc)});
}

export function useReplaceProjectTypeFields() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, fields}: { id: string; fields: TypeField[] }) => replaceProjectTypeFields(id, fields),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useSaveGlobalField() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, data}: { id?: string; data: SaveCustomField }) =>
            id ? updateGlobalField(id, data) : createGlobalField(data),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useDeleteGlobalField() {
    const qc = useQueryClient();
    return useMutation({mutationFn: (id: string) => deleteGlobalField(id), onSuccess: () => invalidateAll(qc)});
}

/** 삭제 확인 문구용 (N개 프로젝트, M개 Task) */
export function useFieldUsage(id?: string) {
    return useQuery({queryKey: ["field-usage", id], queryFn: () => getFieldUsage(id!), enabled: !!id});
}

/** spaceId 없음 = 기본 작업 공간 */
export function useProjectFields(projectId?: string, spaceId?: string | null) {
    return useQuery({
        queryKey: ["project-fields", projectId, spaceId ?? null],
        queryFn: () => getProjectFields(projectId!, spaceId),
        enabled: !!projectId,
    });
}

const invalidateProject = (qc: QueryClient, projectId: string) => {
    qc.invalidateQueries({queryKey: ["project-fields", projectId]});
    qc.invalidateQueries({queryKey: ["field-library", projectId]});
    qc.invalidateQueries({queryKey: ["column-pref", projectId]});
    qc.invalidateQueries({queryKey: ["issues", projectId]});
};

export function useReplaceProjectFields(projectId: string, spaceId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (keys: string[]) => replaceProjectFields(projectId, keys, spaceId),
        onSuccess: () => invalidateProject(qc, projectId),
    });
}

export function useSaveProjectField(projectId: string, spaceId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({id, data}: { id?: string; data: SaveCustomField }) =>
            id ? updateProjectField(projectId, id, data) : createProjectField(projectId, data, spaceId),
        onSuccess: () => invalidateProject(qc, projectId),
    });
}

export function useDeleteProjectField(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteProjectField(projectId, id),
        onSuccess: () => invalidateProject(qc, projectId),
    });
}

export function useColumnPref(projectId?: string, spaceId?: string | null) {
    return useQuery({
        queryKey: ["column-pref", projectId, spaceId ?? null],
        queryFn: () => getColumnPref(projectId!, spaceId),
        enabled: !!projectId,
    });
}

/** keys = null 이면 [기본값으로]. 응답으로 캐시를 바로 바꾼다 */
export function useSaveColumnPref(projectId: string, spaceId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (keys: string[] | null) => (keys ? saveColumnPref(projectId, keys, spaceId) : resetColumnPref(projectId, spaceId)),
        onSuccess: (keys) => qc.setQueryData(["column-pref", projectId, spaceId ?? null], keys),
    });
}

// ── 라이브러리 (전역·타입 필드는 가져가면 복사본) ──

export function useSaveTypeField() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({typeId, id, data}: { typeId: string; id?: string; data: SaveCustomField }) =>
            id ? updateTypeField(typeId, id, data) : createTypeField(typeId, data),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useDeleteTypeField() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({typeId, id}: { typeId: string; id: string }) => deleteTypeField(typeId, id),
        onSuccess: () => invalidateAll(qc),
    });
}

/** 전역 필드 → 타입 필드 복사 */
export function useImportToType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({typeId, sourceFieldId}: { typeId: string; sourceFieldId: string }) => importToType(typeId, sourceFieldId),
        onSuccess: () => invalidateAll(qc),
    });
}

export function useFieldLibrary(projectId?: string) {
    return useQuery({
        queryKey: ["field-library", projectId],
        queryFn: () => getFieldLibrary(projectId!),
        enabled: !!projectId,
    });
}

/** 라이브러리 필드 → 프로젝트 필드 복사 (프로젝트 멤버) */
export function useImportToProject(projectId: string, spaceId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sourceFieldId: string) => importToProject(projectId, sourceFieldId, spaceId),
        onSuccess: () => invalidateProject(qc, projectId),
    });
}
