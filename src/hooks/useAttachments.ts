"use client";

import {deleteAttachment, getAttachments, uploadAttachment,} from "@/lib/api/attachments";
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
        }) => uploadAttachment(issueId, file, onProgress),
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
