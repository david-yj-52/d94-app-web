import Providers from "@/components/Providers";
import type {Metadata, Viewport} from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "D94 · CIRA",
    description: "D94 Workspace & CIRA",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

// 헤더·여백은 그룹 layout 이 맡는다: (main) = ApHeader, (cira) = CiraShell
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
        <body className="min-h-screen bg-d94-bg text-d94-text antialiased">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
