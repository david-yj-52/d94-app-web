import {auth} from "@/auth";
import Providers from "@/components/Providers";
import ApHeader from "@/components/layout/ApHeader";
import NotificationMount from "@/components/layout/NotificationMount";
import "./globals.css";

export const metadata = {
    title: "CIRA",
    description: "Custom Jira — CIRA",
};

export default async function RootLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    return (
        <html lang="ko">
        <body className="bg-gray-50 min-h-screen">
        <Providers>
            {session && <ApHeader user={session.user}/>}
            {session && <NotificationMount/>}
            <main className="py-6">{children}</main>
        </Providers>
        </body>
        </html>
    );
}
