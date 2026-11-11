import apiClient from "./client";

export interface AttachmentResponse {
    id: string;
    issueId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
    downloadUrl: string;
}

export async function getAttachments(issueId: string): Promise<AttachmentResponse[]> {
    const res = await apiClient.get(`/v1/issues/${issueId}/attachments`);
    return res.data.data;
}

/** 조각 업로드 시작. UMD 요청 본문 상한(1MB) 때문에 서버가 정한 partSize(768KB)로 나눠 보낸다 */
export async function startAttachmentUpload(
    issueId: string,
    fileSize: number,
): Promise<{uploadId: string; partSize: number; partCount: number}> {
    const res = await apiClient.post(`/v1/issues/${issueId}/attachments/uploads`, {fileSize});
    return res.data.data;
}

export async function putAttachmentUploadPart(issueId: string, uploadId: string, n: number, blob: Blob): Promise<void> {
    await apiClient.put(`/v1/issues/${issueId}/attachments/uploads/${uploadId}/parts/${n}`, blob, {
        headers: {"Content-Type": "application/octet-stream"},
    });
}

export async function completeAttachmentUpload(issueId: string, uploadId: string, file: File): Promise<AttachmentResponse> {
    const res = await apiClient.post(`/v1/issues/${issueId}/attachments/uploads/${uploadId}/complete`, {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
    });
    return res.data.data;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/v1/attachments/${attachmentId}`);
}

/** 보기·다운로드 URL. 5MB 넘는 파일도 되도록 `/api/attachments/[id]` 가 Range 로 나눠 받아 잇는다 */
export function getDownloadUrl(attachmentId: string): string {
    return `/api/attachments/${attachmentId}`;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
