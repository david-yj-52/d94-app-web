import {auth} from "@/auth";
import ApHeader from "@/components/layout/ApHeader";
import NotificationMount from "@/components/layout/NotificationMount";

// ponytail: 임시 — CiraShell 이 들어오면 교체
export default async function CiraLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    return (
        <div className="cira-root bg-gray-50 min-h-screen">
            {session && <ApHeader user={session.user}/>}
            {session && <NotificationMount/>}
            <main className="py-6">{children}</main>
        </div>
    );
}
