"use client";

import type {CreateAutomationRuleRequest} from "@/lib/api/automation";
import {
    createAutomationRule,
    deleteAutomationRule,
    getAutomationRules,
    getRuleExecutions,
    updateAutomationRule,
} from "@/lib/api/automation";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useAutomationRules(projectId: string) {
    return useQuery({
        queryKey: ["automation-rules", projectId],
        queryFn: () => getAutomationRules(projectId),
        enabled: !!projectId,
    });
}

export function useCreateAutomationRule(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAutomationRuleRequest) =>
            createAutomationRule(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["automation-rules", projectId]});
        },
    });
}

export function useUpdateAutomationRule(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         ruleId,
                         data,
                     }: {
            ruleId: string;
            data: Partial<CreateAutomationRuleRequest>;
        }) => updateAutomationRule(ruleId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["automation-rules", projectId]});
        },
    });
}

export function useDeleteAutomationRule(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ruleId: string) => deleteAutomationRule(ruleId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["automation-rules", projectId]});
        },
    });
}

export function useRuleExecutions(ruleId: string) {
    return useQuery({
        queryKey: ["rule-executions", ruleId],
        queryFn: () => getRuleExecutions(ruleId),
        enabled: !!ruleId,
    });
}
