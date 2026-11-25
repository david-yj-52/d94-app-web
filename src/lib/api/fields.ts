import apiClient from "./client";
import type {
    FieldCatalog,
    FieldDef,
    FieldUsage,
    ProjectTypeResponse,
    SaveCustomField,
    SaveProjectType,
    TypeField,
} from "@/types/fields";

// 기준정보 (쓰기는 ADMIN 아니면 403)
export async function getFieldCatalog(): Promise<FieldCatalog> {
    return (await apiClient.get("/v1/cira/field-catalog")).data.data;
}

export async function getProjectTypes(): Promise<ProjectTypeResponse[]> {
    return (await apiClient.get("/v1/cira/project-types")).data.data;
}

export async function createProjectType(data: SaveProjectType): Promise<ProjectTypeResponse> {
    return (await apiClient.post("/v1/cira/project-types", data)).data.data;
}

export async function updateProjectType(id: string, data: SaveProjectType): Promise<ProjectTypeResponse> {
    return (await apiClient.put(`/v1/cira/project-types/${id}`, data)).data.data;
}

/** 쓰는 프로젝트가 있으면 409 */
export async function deleteProjectType(id: string): Promise<void> {
    await apiClient.delete(`/v1/cira/project-types/${id}`);
}

/** 전체 교체, 순서 = 배열 순서 */
export async function replaceProjectTypeFields(id: string, fields: TypeField[]): Promise<ProjectTypeResponse> {
    return (await apiClient.put(`/v1/cira/project-types/${id}/fields`, fields)).data.data;
}

export async function createGlobalField(data: SaveCustomField): Promise<FieldDef> {
    return (await apiClient.post("/v1/cira/custom-fields", data)).data.data;
}

export async function updateGlobalField(id: string, data: SaveCustomField): Promise<FieldDef> {
    return (await apiClient.put(`/v1/cira/custom-fields/${id}`, data)).data.data;
}

export async function deleteGlobalField(id: string): Promise<void> {
    await apiClient.delete(`/v1/cira/custom-fields/${id}`);
}

export async function getFieldUsage(id: string): Promise<FieldUsage> {
    return (await apiClient.get(`/v1/cira/custom-fields/${id}/usage`)).data.data;
}

// 프로젝트 (쓰기는 프로젝트 ADMIN)
export async function getProjectFields(projectId: string): Promise<FieldDef[]> {
    return (await apiClient.get(`/v1/projects/${projectId}/fields`)).data.data;
}

export async function replaceProjectFields(projectId: string, fieldKeys: string[]): Promise<FieldDef[]> {
    return (await apiClient.put(`/v1/projects/${projectId}/fields`, {fieldKeys})).data.data;
}

export async function createProjectField(projectId: string, data: SaveCustomField): Promise<FieldDef> {
    return (await apiClient.post(`/v1/projects/${projectId}/custom-fields`, data)).data.data;
}

export async function updateProjectField(projectId: string, id: string, data: SaveCustomField): Promise<FieldDef> {
    return (await apiClient.put(`/v1/projects/${projectId}/custom-fields/${id}`, data)).data.data;
}

export async function deleteProjectField(projectId: string, id: string): Promise<void> {
    await apiClient.delete(`/v1/projects/${projectId}/custom-fields/${id}`);
}

// 사람별 목록 컬럼
export async function getColumnPref(projectId: string): Promise<string[]> {
    return (await apiClient.get(`/v1/projects/${projectId}/column-pref`)).data.data.fieldKeys;
}

export async function saveColumnPref(projectId: string, fieldKeys: string[]): Promise<string[]> {
    return (await apiClient.put(`/v1/projects/${projectId}/column-pref`, {fieldKeys})).data.data.fieldKeys;
}

/** [기본값으로] — 타입 기본 표시로 되돌린 결과 */
export async function resetColumnPref(projectId: string): Promise<string[]> {
    return (await apiClient.delete(`/v1/projects/${projectId}/column-pref`)).data.data.fieldKeys;
}
