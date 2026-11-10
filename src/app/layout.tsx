import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
    title: "CIRA",
    description: "Custom Jira — CIRA",
};

// 헤더·여백은 그룹 layout 이 맡는다: (main) = ApHeader, (cira) = CiraShell
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body className="min-h-screen">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
