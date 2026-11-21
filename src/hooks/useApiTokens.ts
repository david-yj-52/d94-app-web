"use client";

import {getApiTokens, getApiTokenServices, issueApiToken, revokeApiToken, setApiTokenService} from "@/lib/api/apiTokens";
import type {IssueApiTokenRequest} from "@/types/apiToken";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

const TOKENS = ["apiTokens"];
const SERVICES = ["apiTokens", "services"];

export function useApiTokens() {
    return useQuery({queryKey: TOKENS, queryFn: getApiTokens});
}

export function useIssueApiToken() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: IssueApiTokenRequest) => issueApiToken(body),
        onSuccess: () => queryClient.invalidateQueries({queryKey: TOKENS, exact: true}),
    });
}

export function useRevokeApiToken() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => revokeApiToken(id),
        onSuccess: () => queryClient.invalidateQueries({queryKey: TOKENS, exact: true}),
    });
}

export function useApiTokenServices() {
    return useQuery({queryKey: SERVICES, queryFn: getApiTokenServices});
}

export function useSetApiTokenService() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({service, enabled}: { service: string; enabled: boolean }) => setApiTokenService(service, enabled),
        onSuccess: (data) => queryClient.setQueryData(SERVICES, data),
    });
}
