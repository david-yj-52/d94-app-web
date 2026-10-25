"use client";

import {callInterfaceTest, getInterfaceTestItems} from "@/lib/api/interfaceTests";
import type {InterfaceCallRequest} from "@/types/interfaceTest";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useInterfaceTestItems() {
    return useQuery({
        queryKey: ["interface-tests"],
        queryFn: getInterfaceTestItems,
        // 통신 테스트 화면이므로 실패를 그대로 보여 준다
        retry: false,
    });
}

/** 버튼 하나 = 호출 하나. 데이터를 바꾸는 호출이 성공하면 목록을 다시 읽는다. */
export function useInterfaceCall() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (req: InterfaceCallRequest) => callInterfaceTest(req),
        onSuccess: (result) => {
            const changed = result.method !== "GET" && result.method !== "HEAD";
            if (changed && result.status >= 200 && result.status < 300) {
                queryClient.invalidateQueries({queryKey: ["interface-tests"]});
            }
        },
    });
}
