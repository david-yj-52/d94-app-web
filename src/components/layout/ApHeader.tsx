"use client";

import {signOut} from "next-auth/react";
import AgentStatusButton from "../AgentStatusButton";
import TshLogo from "../TshLogo";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import Link from "next/link";
import {usePathname} from "next/navigation";

const NAV_ITEMS = [
    {href: "/home", label: "홈"},
    {href: "/projects", label: "프로젝트"},
    {href: "/todo", label: "Tasks"},
    {href: "/mpms", label: "MPMS"},
];

export default function ApHeader({user}: { user: any }) {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2 no-underline">
                <TshLogo className="h-7 w-7 shrink-0 object-contain"/>
                <span className="text-base font-bold tracking-tight text-gray-900">
          TSHInc
        </span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
                {NAV_ITEMS.map(({href, label}) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                "flex h-8 items-center rounded-lg px-3 text-sm transition-colors no-underline",
                                active
                                    ? "bg-blue-50 font-semibold text-blue-600"
                                    : "font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                            ].join(" ")}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Right */}
            <div className="flex h-8 items-center gap-2">
                <GlobalSearch/>
                <div className="h-5 w-px bg-gray-200"/>
                <NotificationBell/>
                <AgentStatusButton/>
                <div className="h-5 w-px bg-gray-200"/>
                <span className="text-sm text-gray-600">
          <strong className="font-semibold">{user?.name}</strong> 님
        </span>
                <button
                    onClick={() => signOut()}
                    className="flex h-8 items-center rounded-lg bg-gray-100 px-3 text-sm text-gray-700 transition-colors hover:bg-gray-200 whitespace-nowrap"
                >
                    Log Out
                </button>
            </div>
        </header>
    );
}
