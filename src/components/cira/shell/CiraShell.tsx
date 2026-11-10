"use client";

import Dialog from "@/components/cira/ui/Dialog";
import Menu from "@/components/cira/ui/Menu";
import {Avatar} from "@/components/cira/ui/Badges";
import GlobalSearch from "@/components/layout/GlobalSearch";
import NotificationBell from "@/components/layout/NotificationBell";
import {Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Search} from "lucide-react";
import {signOut} from "next-auth/react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {type ReactNode, useEffect, useState} from "react";
import CiraSidebar from "./CiraSidebar";
import CreateIssueButton from "./CreateIssueButton";
import {getNavContext, SIDEBAR_COOKIE} from "./navContext";

export default function CiraShell({user, initialCollapsed, children}: {
    user?: { name?: string | null; email?: string | null };
    initialCollapsed: boolean;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(initialCollapsed);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => setDrawerOpen(false), [pathname]);

    function toggle() {
        const next = !collapsed;
        setCollapsed(next);
        // 서버 layout 이 쿠키를 읽어 첫 렌더부터 같은 폭을 그린다 (localStorage 금지 규칙)
        document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; Path=/cira; Max-Age=31536000; SameSite=Lax`;
    }

    return (
        <div className="cira-root flex min-h-screen flex-col">
            <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b border-cira-border bg-white px-2 md:px-4">
                <button onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기"
                        className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 md:hidden">
                    <MenuIcon className="h-5 w-5"/>
                </button>
                <Link href="/cira/projects" className="flex items-center gap-2 no-underline">
                    <span className="h-6 w-6 rounded-md bg-cira-brand"/>
                    <span className="font-extrabold tracking-wide text-cira-brand">CIRA</span>
                </Link>
                <div className="flex-1"/>
                <div className="hidden md:block"><GlobalSearch/></div>
                <Link href="/cira/search" aria-label="검색"
                      className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 md:hidden">
                    <Search className="h-5 w-5"/>
                </Link>
                <CreateIssueButton projectId={getNavContext(pathname).projectId}/>
                <NotificationBell/>
                <Menu
                    trigger={
                        <button aria-label="프로필 메뉴" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
                            <Avatar name={user?.name || user?.email} size="md"/>
                        </button>
                    }
                    items={[
                        {label: <span className="text-cira-muted">{user?.email ?? user?.name ?? "-"}</span>, onSelect: () => {}, disabled: true},
                        {label: "D94 Home으로 돌아가기", onSelect: () => router.push("/home")},
                        {label: "로그아웃", onSelect: () => signOut({callbackUrl: "/login"}), danger: true},
                    ]}
                />
            </header>

            <div className="flex flex-1">
                <aside
                    className={`sticky top-12 hidden h-[calc(100vh-3rem)] shrink-0 flex-col overflow-y-auto border-r border-cira-border bg-cira-sidebar md:flex ${
                        collapsed ? "w-14" : "w-14 lg:w-60"
                    }`}
                >
                    {/* 태블릿(768–1023px)은 항상 아이콘만 */}
                    <div className="lg:hidden"><CiraSidebar collapsed/></div>
                    <div className="hidden lg:block"><CiraSidebar collapsed={collapsed}/></div>
                    <button onClick={toggle} aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
                            className="mt-auto hidden h-10 items-center justify-center border-t border-cira-border text-cira-muted hover:bg-gray-100 lg:flex">
                        {collapsed ? <PanelLeftOpen className="h-4 w-4"/> : <PanelLeftClose className="h-4 w-4"/>}
                    </button>
                </aside>
                <main className="min-w-0 flex-1 py-5">{children}</main>
            </div>

            <Dialog open={drawerOpen} onOpenChange={setDrawerOpen} title="CIRA 메뉴" side="left">
                <CiraSidebar/>
            </Dialog>
        </div>
    );
}
