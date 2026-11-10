import apiClient from "./client";
import type {PageResponse} from "@/types/issue";
import type {
    AnnotationListItem,
    CreateAnnotationRequest,
    StartUploadResponse,
    StudyDocument,
    StudyPage,
    StudyTerm,
    TermRequest,
    TocNode,
    UpdateAnnotationRequest,
} from "@/types/study";

const BASE = "/v1/study";

export async function getStudyDocuments(page = 0): Promise<PageResponse<StudyDocument>> {
    const res = await apiClient.get(`${BASE}/documents`, {params: {page}});
    return res.data.data;
}

export async function getStudyDocument(id: string): Promise<StudyDocument> {
    const res = await apiClient.get(`${BASE}/documents/${id}`);
    return res.data.data;
}

export async function deleteStudyDocument(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/documents/${id}`);
}

export async function startStudyUpload(fileName: string, fileSize: number): Promise<StartUploadResponse> {
    const res = await apiClient.post(`${BASE}/documents/uploads`, {fileName, fileSize});
    return res.data.data;
}

/** UMD 본문 상한(1MB) 때문에 서버가 정한 partSize(768KB)로 잘라 보낸다 */
export async function putStudyUploadPart(uploadId: string, n: number, blob: Blob): Promise<void> {
    await apiClient.put(`${BASE}/documents/uploads/${uploadId}/parts/${n}`, blob, {
        headers: {"Content-Type": "application/octet-stream"},
    });
}

export async function completeStudyUpload(uploadId: string): Promise<StudyDocument> {
    const res = await apiClient.post(`${BASE}/documents/uploads/${uploadId}/complete`);
    return res.data.data;
}

export async function getStudyToc(id: string): Promise<TocNode[]> {
    const res = await apiClient.get(`${BASE}/documents/${id}/toc`);
    return res.data.data;
}

export async function getStudyPage(id: string, pageSectionId: string): Promise<StudyPage> {
    const res = await apiClient.get(`${BASE}/documents/${id}/pages/${pageSectionId}`);
    return res.data.data;
}

export async function getStudyTerms(documentId?: string): Promise<StudyTerm[]> {
    const res = await apiClient.get(`${BASE}/terms`, {params: {documentId}});
    return res.data.data;
}

export async function createStudyTerm(req: TermRequest): Promise<StudyTerm> {
    const res = await apiClient.post(`${BASE}/terms`, req);
    return res.data.data;
}

export async function updateStudyTerm(id: string, req: TermRequest): Promise<StudyTerm> {
    const res = await apiClient.put(`${BASE}/terms/${id}`, req);
    return res.data.data;
}

export async function deleteStudyTerm(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/terms/${id}`);
}

export async function getStudyAnnotations(documentId?: string): Promise<AnnotationListItem[]> {
    const res = await apiClient.get(`${BASE}/annotations`, {params: {documentId}});
    return res.data.data;
}

export async function createStudyAnnotation(req: CreateAnnotationRequest): Promise<AnnotationListItem> {
    const res = await apiClient.post(`${BASE}/annotations`, req);
    return res.data.data;
}

export async function updateStudyAnnotation(id: string, req: UpdateAnnotationRequest): Promise<AnnotationListItem> {
    const res = await apiClient.patch(`${BASE}/annotations/${id}`, req);
    return res.data.data;
}

export async function deleteStudyAnnotation(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/annotations/${id}`);
}
