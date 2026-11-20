"use client";

import {getSettings, updateSettings} from "@/lib/api/settings";
import {getMe} from "@/lib/api/users";
import type {SettingMap} from "@/types/settings";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useSettings() {
    return useQuery({queryKey: ["settings"], queryFn: getSettings});
}

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (changes: SettingMap) => updateSettings(changes),
        onSuccess: (data) => queryClient.setQueryData(["settings"], data),
    });
}

export function useMe() {
    return useQuery({queryKey: ["users", "me"], queryFn: getMe});
}

/** 화면 표시용 판단. 실제 권한 검사는 백엔드(@PreAuthorize)가 한다 */
export function useIsAdmin(): boolean {
    return useMe().data?.roles.includes("ADMIN") ?? false;
}
