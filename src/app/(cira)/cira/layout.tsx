import {auth} from "@/auth";
import CiraShell from "@/components/cira/shell/CiraShell";
import {SIDEBAR_COOKIE} from "@/components/cira/shell/navContext";
import NotificationMount from "@/components/layout/NotificationMount";
import {cookies} from "next/headers";

// CIRA 전용 셸. 세션은 루트 Providers 와 공유 → ADR 0006
export default async function CiraLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
    return (
        <CiraShell user={session?.user} initialCollapsed={collapsed}>
            {session && <NotificationMount/>}
            {children}
        </CiraShell>
    );
}
