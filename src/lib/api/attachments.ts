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

export async function uploadAttachment(
    issueId: string,
    file: File,
    onUploadProgress?: (percent: number) => void,
): Promise<AttachmentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post(`/v1/issues/${issueId}/attachments`, formData, {
        headers: {"Content-Type": undefined as unknown as string},
        onUploadProgress: (e) => {
            if (onUploadProgress && e.total) {
                onUploadProgress(Math.round((e.loaded * 100) / e.total));
            }
        },
    });
    return res.data.data;
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/v1/attachments/${attachmentId}`);
}

export function getDownloadUrl(attachmentId: string): string {
    return `/api/proxy/v1/attachments/${attachmentId}/download`;
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
