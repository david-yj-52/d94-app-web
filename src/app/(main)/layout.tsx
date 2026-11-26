import {auth} from "@/auth";
import ApHeader from "@/components/layout/ApHeader";
import NotificationMount from "@/components/layout/NotificationMount";

export default async function MainLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    return (
        <div className="min-h-screen bg-d94-bg">
            {session && <ApHeader user={session.user}/>}
            {session && <NotificationMount/>}
            <main className="py-6">{children}</main>
        </div>
    );
}
