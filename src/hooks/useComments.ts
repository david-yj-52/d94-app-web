"use client";

import {createComment, deleteComment, getComments, toggleReaction, updateComment,} from "@/lib/api/comments";
import type {CreateCommentRequest, UpdateCommentRequest,} from "@/types/comment";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useComments(issueId: string) {
    return useQuery({
        queryKey: ["comments", issueId],
        queryFn: () => getComments(issueId),
        enabled: !!issueId,
    });
}

export function useCreateComment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCommentRequest) => createComment(issueId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

export function useUpdateComment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         commentId,
                         data,
                     }: {
            commentId: string;
            data: UpdateCommentRequest;
        }) => updateComment(commentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

export function useDeleteComment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId: string) => deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

/** 반응 추가·취소 (백엔드는 같은 POST 로 토글한다) */
export function useToggleReaction(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({commentId, reactionType}: { commentId: string; reactionType: string }) =>
            toggleReaction(commentId, reactionType),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}
