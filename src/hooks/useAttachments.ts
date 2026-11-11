"use client";

import {
    completeAttachmentUpload,
    deleteAttachment,
    getAttachments,
    putAttachmentUploadPart,
    startAttachmentUpload,
} from "@/lib/api/attachments";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useAttachments(issueId: string) {
    return useQuery({
        queryKey: ["attachments", issueId],
        queryFn: () => getAttachments(issueId),
        enabled: !!issueId,
    });
}

export function useUploadAttachment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         file,
                         onProgress,
                     }: {
            file: File;
            onProgress?: (percent: number) => void;
        }) => uploadInParts(issueId, file, onProgress),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["attachments", issueId]});
        },
    });
}

export function useDeleteAttachment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["attachments", issueId]});
        },
    });
}

/** start → 조각(768KB)을 순서대로 PUT(실패하면 한 번 재시도) → complete. 진행률은 보낸 조각 비율 */
async function uploadInParts(issueId: string, file: File, onProgress?: (percent: number) => void) {
    const {uploadId, partSize, partCount} = await startAttachmentUpload(issueId, file.size);
    for (let n = 1; n <= partCount; n++) {
        const blob = file.slice((n - 1) * partSize, n * partSize);
        try {
            await putAttachmentUploadPart(issueId, uploadId, n, blob);
        } catch {
            await putAttachmentUploadPart(issueId, uploadId, n, blob);
        }
        onProgress?.(Math.round((n * 100) / partCount));
    }
    return completeAttachmentUpload(issueId, uploadId, file);
}
