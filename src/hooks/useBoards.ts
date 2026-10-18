"use client";

import {
    addColumn,
    createBoard,
    deleteBoard,
    deleteColumn,
    getBoardDetail,
    getBoards,
    moveIssue,
    updateBoard,
    updateColumn,
} from "@/lib/api/boards";
import type {
    BoardDetailResponse,
    CreateBoardColumnRequest,
    CreateBoardRequest,
    MoveIssueRequest,
    UpdateBoardColumnRequest,
    UpdateBoardRequest,
} from "@/types/board";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useBoards(projectId: string) {
    return useQuery({
        queryKey: ["boards", projectId],
        queryFn: () => getBoards(projectId),
        enabled: !!projectId,
    });
}

export function useBoardDetail(boardId: string) {
    return useQuery({
        queryKey: ["board", boardId],
        queryFn: () => getBoardDetail(boardId),
        enabled: !!boardId,
    });
}

export function useCreateBoard(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBoardRequest) => createBoard(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["boards", projectId]});
        },
    });
}

export function useUpdateBoard(boardId: string, projectId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateBoardRequest) => updateBoard(boardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["board", boardId]});
            if (projectId) {
                queryClient.invalidateQueries({queryKey: ["boards", projectId]});
            }
        },
    });
}

export function useDeleteBoard(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (boardId: string) => deleteBoard(boardId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["boards", projectId]});
        },
    });
}

export function useAddColumn(boardId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBoardColumnRequest) => addColumn(boardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["board", boardId]});
        },
    });
}

export function useUpdateColumn(boardId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         columnId,
                         data,
                     }: {
            columnId: string;
            data: UpdateBoardColumnRequest;
        }) => updateColumn(boardId, columnId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["board", boardId]});
        },
    });
}

export function useDeleteColumn(boardId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (columnId: string) => deleteColumn(boardId, columnId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["board", boardId]});
        },
    });
}

export function useMoveIssue(boardId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         issueId,
                         data,
                     }: {
            issueId: string;
            data: MoveIssueRequest;
        }) => moveIssue(boardId, issueId, data),
        onMutate: async ({issueId, data}) => {
            await queryClient.cancelQueries({queryKey: ["board", boardId]});
            const previous = queryClient.getQueryData<BoardDetailResponse>([
                "board",
                boardId,
            ]);

            if (previous) {
                const movedIssue = previous.columns
                    .flatMap((c) => c.issues)
                    .find((i) => i.id === issueId);

                if (movedIssue) {
                    const updated: BoardDetailResponse = {
                        ...previous,
                        columns: previous.columns.map((col) => {
                            const withoutIssue = col.issues.filter((i) => i.id !== issueId);

                            if (col.id === data.targetColumnId) {
                                if (data.beforeIssueId) {
                                    const idx = withoutIssue.findIndex(
                                        (i) => i.id === data.beforeIssueId,
                                    );
                                    const newIssues = [...withoutIssue];
                                    newIssues.splice(
                                        idx >= 0 ? idx : withoutIssue.length,
                                        0,
                                        movedIssue,
                                    );
                                    return {...col, issues: newIssues};
                                }
                                if (data.afterIssueId) {
                                    const idx = withoutIssue.findIndex(
                                        (i) => i.id === data.afterIssueId,
                                    );
                                    const newIssues = [...withoutIssue];
                                    newIssues.splice(
                                        idx >= 0 ? idx + 1 : withoutIssue.length,
                                        0,
                                        movedIssue,
                                    );
                                    return {...col, issues: newIssues};
                                }
                                return {...col, issues: [...withoutIssue, movedIssue]};
                            }

                            return {...col, issues: withoutIssue};
                        }),
                    };
                    queryClient.setQueryData(["board", boardId], updated);
                }
            }

            return {previous};
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["board", boardId], context.previous);
            }
        },
        onSuccess: (serverData) => {
            queryClient.setQueryData(["board", boardId], serverData);
        },
    });
}
