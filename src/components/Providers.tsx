"use client";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {SessionProvider} from "next-auth/react";
import {useState} from "react";

import ReauthModal from "@/components/auth/ReauthModal";
import SessionActivity from "@/components/auth/SessionActivity";
import {useReauthStore} from "@/lib/api/session";

export default function Providers({children}: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 1000 * 30,
                        retry: 1,
                    },
                },
            }),
    );
    const reauthOpen = useReauthStore((s) => s.open);

    // refetchOnWindowFocus 끔: 세션 조회(GET)도 쿠키를 다시 쓰므로, refresh 와 겹쳐 회전된 쿠키를 덮을 일을 줄인다 (ADR 0007)
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <QueryClientProvider client={queryClient}>
                {children}
                {/* LoginForm 이 useMutation 을 쓰므로 QueryClientProvider 안에 둔다 */}
                {reauthOpen && <ReauthModal/>}
            </QueryClientProvider>
            <SessionActivity/>
        </SessionProvider>
    );
}
