"use client";

import {useProjectMembers} from "@/hooks/useProjectSettings";
import {useProjects} from "@/hooks/useProjects";
import {
    Bell,
    BookOpen,
    ChartLine,
    Columns3,
    FileSearch,
    LayoutDashboard,
    ListTodo,
    Package,
    Search,
    Settings,
    SquareKanban,
    type LucideIcon,
} from "lucide-react";
import {useSession} from "next-auth/react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {getNavContext} from "./navContext";

const SETTINGS_MENU = [
    {suffix: "", label: "기본 정보"},
    {suffix: "/members", label: "멤버"},
    {suffix: "/workflow", label: "워크플로우"},
    {suffix: "/git", label: "Git 연동"},
    {suffix: "/automation", label: "자동화"},
];

function NavItem({href, label, icon: Icon, active, collapsed, indent}: {
    href: string;
    label: string;
    icon?: LucideIcon;
    active: boolean;
    collapsed: boolean;
    indent?: boolean;
}) {
    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            className={`flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm no-underline transition-colors ${
                active ? "bg-cira-brand-soft font-semibold text-cira-brand" : "text-gray-700 hover:bg-gray-100"
            } ${indent && !collapsed ? "pl-7" : ""} ${collapsed ? "justify-center" : ""}`}
        >
            {Icon && <Icon className="h-4 w-4 shrink-0"/>}
            {!collapsed && <span className="truncate">{label}</span>}
        </Link>
    );
}

function Section({label, collapsed}: { label: string; collapsed: boolean }) {
    if (collapsed) return <div className="my-2 border-t border-cira-border"/>;
    return <p className="mb-1 mt-4 px-2 text-[11px] font-bold uppercase tracking-wide text-cira-muted">{label}</p>;
}

export default function CiraSidebar({collapsed = false}: { collapsed?: boolean }) {
    const pathname = usePathname();
    const {projectId, inSettings} = getNavContext(pathname);
    const {data: projects = []} = useProjects();
    const {data: session} = useSession();
    const {data: members} = useProjectMembers(projectId ?? "");
    // 설정은 프로젝트 ADMIN 만 (기존 ProjectNav 규칙)
    const isAdmin = !!session?.user?.email && members?.some((m) => m.email === session.user?.email && m.role === "ADMIN") === true;

    const is = (href: string) => pathname === href || pathname.startsWith(href + "/");
    const base = projectId ? `/cira/projects/${projectId}` : "";
    const projectMenu = [
        {href: `${base}/sprints`, label: "백로그", icon: ListTodo},
        {href: `${base}/boards`, label: "보드", icon: SquareKanban},
        {href: `${base}/issues`, label: "이슈", icon: Columns3},
        {href: `${base}/reports`, label: "리포트", icon: ChartLine},
        {href: `${base}/versions`, label: "릴리스", icon: Package},
        {href: `${base}/wiki`, label: "위키", icon: BookOpen},
        ...(isAdmin ? [{href: `${base}/settings`, label: "프로젝트 설정", icon: Settings}] : []),
    ];

    return (
        <nav className="flex flex-col p-2" aria-label="CIRA 메뉴">
            <NavItem href="/cira/dashboard" label="내 작업" icon={LayoutDashboard} active={is("/cira/dashboard")} collapsed={collapsed}/>
            <NavItem href="/cira/notifications" label="알림" icon={Bell} active={is("/cira/notifications")} collapsed={collapsed}/>

            <Section label="프로젝트" collapsed={collapsed}/>
            {!collapsed && (
                <NavItem href="/cira/projects" label="모든 프로젝트" active={pathname === "/cira/projects"} collapsed={collapsed}/>
            )}
            {projects.map((p) => {
                const open = p.id === projectId;
                return (
                    <div key={p.id}>
                        <Link
                            href={`/cira/projects/${p.id}/boards`}
                            title={collapsed ? p.name : undefined}
                            className={`flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm no-underline hover:bg-gray-100 ${
                                open ? "font-semibold text-cira-text" : "text-gray-700"
                            } ${collapsed ? "justify-center" : ""}`}
                        >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-200 text-[10px] font-bold text-amber-800">
                                {p.key.slice(0, 2)}
                            </span>
                            {!collapsed && <span className="truncate">{p.name}</span>}
                        </Link>
                        {open && !inSettings && projectMenu.map((m) => (
                            <NavItem key={m.href} {...m} active={is(m.href)} collapsed={collapsed} indent/>
                        ))}
                        {open && inSettings && SETTINGS_MENU.map((s) => {
                            const href = `${base}/settings${s.suffix}`;
                            const active = s.suffix === "" ? pathname === href : is(href);
                            return <NavItem key={href} href={href} label={s.label} icon={Settings} active={active} collapsed={collapsed} indent/>;
                        })}
                    </div>
                );
            })}

            <Section label="필터" collapsed={collapsed}/>
            <NavItem href="/cira/search" label="검색" icon={Search} active={pathname === "/cira/search"} collapsed={collapsed}/>
            <NavItem href="/cira/search/advanced" label="고급 검색 (CQL)" icon={FileSearch} active={is("/cira/search/advanced")} collapsed={collapsed}/>
        </nav>
    );
}
