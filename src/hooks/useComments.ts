"use client";

import {
    addReaction,
    createComment,
    deleteComment,
    getComments,
    removeReaction,
    updateComment,
} from "@/lib/api/comments";
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
        }) => updateComment(issueId, commentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

export function useDeleteComment(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId: string) => deleteComment(issueId, commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

export function useAddReaction(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({commentId, emoji}: { commentId: string; emoji: string }) =>
            addReaction(commentId, emoji),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}

export function useRemoveReaction(issueId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({commentId, emoji}: { commentId: string; emoji: string }) =>
            removeReaction(commentId, emoji),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", issueId]});
        },
    });
}
