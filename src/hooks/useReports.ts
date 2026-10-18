"use client";

import {getBurndown, getCfd, getDashboard, getVelocity,} from "@/lib/api/reports";
import {useQuery} from "@tanstack/react-query";

export function useBurndown(sprintId: string | null) {
    return useQuery({
        queryKey: ["burndown", sprintId],
        queryFn: () => getBurndown(sprintId!),
        enabled: !!sprintId,
    });
}

export function useVelocity(projectId: string, lastN = 6) {
    return useQuery({
        queryKey: ["velocity", projectId, lastN],
        queryFn: () => getVelocity(projectId, lastN),
        enabled: !!projectId,
    });
}

export function useCfd(
    projectId: string,
    startDate: string,
    endDate: string,
) {
    return useQuery({
        queryKey: ["cfd", projectId, startDate, endDate],
        queryFn: () => getCfd(projectId, startDate, endDate),
        enabled: !!projectId && !!startDate && !!endDate,
    });
}

export function useDashboard() {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: getDashboard,
    });
}
