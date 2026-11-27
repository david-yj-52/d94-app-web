"use client";

import {signOut} from "next-auth/react";
import TshLogo from "../TshLogo";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Menu, Settings} from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import {useState} from "react";
import {useIsAdmin, useSettings} from "@/hooks/useSettings";
import {DEFAULT_LOGO_TEXT, LOGO_FONT_KEY, LOGO_TEXT_KEY} from "@/types/settings";
import {logoFontClass} from "@/components/ui/logoFonts";
import Button from "@/components/ui/Button";

const NAV_ITEMS = [
    {href: "/home", label: "홈"},
    {href: "/cira/projects", label: "프로젝트"},
    {href: "/todo", label: "Tasks"},
    {href: "/mpms", label: "MPMS"},
];

export default function ApHeader({user}: { user: any }) {
    const pathname = usePathname();
    const {data: settings} = useSettings();
    const isAdmin = useIsAdmin();
    const [menuOpen, setMenuOpen] = useState(false);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-3 shadow-sm md:px-6">
            {/* Logo */}
            <Link href="/home" className="flex shrink-0 items-center gap-2 no-underline">
                <TshLogo className="h-7 w-7 shrink-0 object-contain"/>
                <span data-testid="logo-text"
                      className={`text-base font-bold tracking-tight text-gray-900 ${logoFontClass(settings?.[LOGO_FONT_KEY])}`}>
                    {settings?.[LOGO_TEXT_KEY] || DEFAULT_LOGO_TEXT}
                </span>
            </Link>

            {/* Nav */}
            <nav className="hidden items-center gap-1 md:flex">
                {NAV_ITEMS.map(({href, label}) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                "flex h-8 items-center rounded-lg px-3 text-sm transition-colors no-underline",
                                active
                                    ? "bg-d94-brand-soft font-semibold text-d94-brand"
                                    : "font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                            ].join(" ")}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Right */}
            <div className="ml-3 flex h-8 min-w-0 flex-1 items-center justify-end gap-2 md:flex-none">
                <GlobalSearch/>
                <div className="hidden h-5 w-px bg-gray-200 md:block"/>
                <NotificationBell/>
                <Button variant="unstyled"
                    onClick={() => setMenuOpen(true)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
                    aria-label="메뉴"
                    aria-expanded={menuOpen}
                >
                    <Menu className="h-5 w-5"/>
                </Button>
                <div className="hidden h-5 w-px bg-gray-200 md:block"/>
                <span className="hidden whitespace-nowrap text-sm text-gray-600 md:inline">
          <strong className="font-semibold">{user?.name}</strong> 님
        </span>
                {isAdmin && (
                    <Link
                        href="/settings"
                        className="hidden h-8 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm text-gray-700 no-underline transition-colors hover:bg-gray-200 whitespace-nowrap md:flex"
                    >
                        <Settings className="h-4 w-4" aria-hidden/>
                        기준정보
                    </Link>
                )}
                <Button variant="unstyled"
                    onClick={() => signOut()}
                    className="hidden h-8 items-center rounded-lg bg-gray-100 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-200 whitespace-nowrap md:flex"
                >
                    Log Out
                </Button>
            </div>

            {/* 모바일 메뉴 (< md): 왼쪽 서랍. Dialog 가 바깥 클릭·ESC·포커스 가둠을 처리 */}
            <Dialog open={menuOpen} onOpenChange={setMenuOpen} title="메뉴" side="left">
                <nav className="flex flex-col p-2">
                    {NAV_ITEMS.map(({href, label}) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className={`flex h-10 items-center rounded-lg px-3 text-sm no-underline ${
                                isActive(href) ? "bg-d94-brand-soft font-semibold text-d94-brand" : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2 border-t border-d94-border p-3">
                    <span className="text-sm text-gray-600">
                        <strong className="font-semibold">{user?.name}</strong> 님
                    </span>
                    {isAdmin && (
                        <Link
                            href="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="flex h-10 items-center gap-1 rounded-lg bg-gray-100 px-3 text-sm text-gray-700 no-underline hover:bg-gray-200"
                        >
                            <Settings className="h-4 w-4" aria-hidden/>
                            기준정보
                        </Link>
                    )}
                    <Button variant="unstyled"
                        onClick={() => signOut()}
                        className="flex h-10 items-center rounded-lg bg-gray-100 px-3 text-sm text-gray-700 hover:bg-gray-200"
                    >
                        Log Out
                    </Button>
                </div>
            </Dialog>
        </header>
    );
}
