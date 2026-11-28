"use client";

import Button from "@/components/ui/Button";
import CreateSpaceModal from "@/components/project/CreateSpaceModal";
import {useProjectMembers} from "@/hooks/useProjectSettings";
import {useCurrentSpace} from "@/hooks/useSpaces";
import {useProject} from "@/hooks/useProjects";
import {
    ArrowLeft,
    Bell,
    BookOpen,
    ChartLine,
    ChevronDown,
    ChevronRight,
    Columns3,
    FileSearch,
    FolderKanban,
    Layers,
    LayoutDashboard,
    Plus,
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
import {Suspense, useState} from "react";
import {getNavContext, teamActive, teamLinks} from "./navContext";

/** 프로젝트 설정 (프로젝트 ADMIN) */
const PROJECT_SETTINGS = [
    {suffix: "", label: "기본 정보"},
    {suffix: "/members", label: "멤버"},
    {suffix: "/git", label: "Git 연동"},
    {suffix: "/automation", label: "자동화"},
];
/** 작업 공간 설정 (프로젝트 ADMIN 또는 그 공간 관리자, 설계 7.2) — ?space= 를 이어 붙인다 */
const SPACE_SETTINGS = [
    {suffix: "/space", label: "공간 정보"},
    {suffix: "/workflow", label: "워크플로"},
    {suffix: "/fields", label: "필드"},
    {suffix: "/boards", label: "보드 · 뷰"},
    {suffix: "/docs", label: "산출물 규칙"},
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

function SubLabel({label, collapsed}: { label: string; collapsed: boolean }) {
    if (collapsed) return null;
    return <p className="mt-2 truncate pl-7 pr-2 text-[11px] font-semibold text-cira-muted">{label}</p>;
}

/** useSearchParams(현재 작업 공간 ?space=) 를 쓰므로 정적 경로 빌드를 위해 Suspense 로 감싼다 */
export default function CiraSidebar(props: { collapsed?: boolean }) {
    return (
        <Suspense fallback={null}>
            <SidebarInner {...props}/>
        </Suspense>
    );
}

function SidebarInner({collapsed = false}: { collapsed?: boolean }) {
    const pathname = usePathname();
    const {projectId, inSettings} = getNavContext(pathname);
    // 프로젝트 안은 전용 워크스페이스: 다른 프로젝트는 그리지 않고 허브(/cira/projects)를 거쳐 이동
    const {data: project} = useProject(projectId ?? "");
    const projects = project ? [project] : [];
    const {data: session} = useSession();
    const {data: members} = useProjectMembers(projectId ?? "");
    // 설정은 프로젝트 ADMIN 만 (기존 ProjectNav 규칙)
    const isAdmin = !!session?.user?.email && members?.some((m) => m.email === session.user?.email && m.role === "ADMIN") === true;
    // V650: 프로젝트 하위 작업 공간. 보드·Task·설정(워크플로·필드·문서)은 지금 공간 기준
    const {space, spaces, isAll, setSpace, withSpace} = useCurrentSpace(projectId);
    const [addingSpace, setAddingSpace] = useState(false);
    // 펼친 팀. 지금 보고 있는 팀은 항상 펼침 (ponytail: 컴포넌트 상태 — 저장소 직접 접근 금지 규칙)
    const [opened, setOpened] = useState<Set<string>>(new Set());
    const toggleTeam = (id: string) => setOpened((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const is = (href: string) => pathname === href || pathname.startsWith(href + "/");
    const base = projectId ? `/cira/projects/${projectId}` : "";
    // 프로젝트 통합 메뉴 (모든 팀). 팀별 보드·Task·공간 설정은 아래 팀 트리
    const projectMenu = [
        {href: `${base}/features`, label: "Feature (전체 통합)", icon: Layers, active: is(`${base}/features`)},
        {href: `${base}/issues`, label: "Task (전체)", icon: Columns3, active: pathname === `${base}/issues` && isAll},
        {href: `${base}/sprints`, label: "백로그", icon: ListTodo, active: is(`${base}/sprints`)},
        {href: `${base}/reports`, label: "리포트", icon: ChartLine, active: is(`${base}/reports`)},
        {href: `${base}/versions`, label: "릴리스", icon: Package, active: is(`${base}/versions`)},
        {href: `${base}/wiki`, label: "위키", icon: BookOpen, active: is(`${base}/wiki`)},
        ...(isAdmin ? [{href: `${base}/settings`, label: "프로젝트 설정", icon: Settings, active: false}] : []),
    ];
    const TEAM_ICONS: Record<string, LucideIcon> = {"/boards": SquareKanban, "/issues": Columns3, "/settings/space": Settings};

    return (
        <nav className="flex flex-col p-2" aria-label="CIRA 메뉴">
            <NavItem href="/cira/dashboard" label="내 작업" icon={LayoutDashboard} active={is("/cira/dashboard")} collapsed={collapsed}/>
            <NavItem href="/cira/notifications" label="알림" icon={Bell} active={is("/cira/notifications")} collapsed={collapsed}/>

            <Section label="프로젝트" collapsed={collapsed}/>
            <NavItem href="/cira/projects" label="모든 프로젝트" icon={projectId ? ArrowLeft : FolderKanban}
                     active={pathname === "/cira/projects"} collapsed={collapsed}/>
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
                            <NavItem key={m.href} {...m} collapsed={collapsed} indent/>
                        ))}
                        {open && !inSettings && (
                            <>
                                <SubLabel label="작업 공간" collapsed={collapsed}/>
                                {spaces.map((sp) => {
                                    if (collapsed) {
                                        // 아이콘만: 팀 이름 앞 두 글자 배지 → 그 팀 보드
                                        return (
                                            <Link key={sp.id} href={withSpace(`${base}/boards`, sp.id)} title={sp.name}
                                                  className={`flex min-h-9 items-center justify-center rounded-md text-[10px] font-bold no-underline hover:bg-gray-100 ${
                                                      space?.id === sp.id && !isAll ? "text-cira-brand" : "text-gray-600"}`}>
                                                {sp.name.slice(0, 2)}
                                            </Link>
                                        );
                                    }
                                    const expanded = opened.has(sp.id) || space?.id === sp.id;
                                    return (
                                        <div key={sp.id}>
                                            <Button variant="unstyled" type="button" onClick={() => toggleTeam(sp.id)} aria-expanded={expanded}
                                                    className="flex min-h-9 w-full items-center gap-1.5 rounded-md pl-7 pr-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                                                {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0"/> : <ChevronRight className="h-3.5 w-3.5 shrink-0"/>}
                                                <span className="truncate">{sp.name}</span>
                                            </Button>
                                            {expanded && teamLinks(sp.canManage).map((l) => (
                                                <Link key={l.suffix} href={withSpace(base + l.suffix, sp.id)}
                                                      className={`flex min-h-9 items-center gap-2.5 rounded-md pl-12 pr-2 text-sm no-underline transition-colors ${
                                                          teamActive(pathname, base, l.suffix, sp.id, space?.id, isAll)
                                                              ? "bg-cira-brand-soft font-semibold text-cira-brand" : "text-gray-700 hover:bg-gray-100"}`}>
                                                    {(() => { const Icon = TEAM_ICONS[l.suffix]; return <Icon className="h-4 w-4 shrink-0"/>; })()}
                                                    <span className="truncate">{l.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    );
                                })}
                                {isAdmin && !collapsed && (
                                    <Button variant="unstyled" type="button" onClick={() => setAddingSpace(true)}
                                            className="flex min-h-9 w-full items-center gap-1.5 rounded-md pl-7 pr-2 text-left text-sm text-cira-muted hover:bg-gray-100">
                                        <Plus className="h-3.5 w-3.5 shrink-0"/> 작업 공간 추가
                                    </Button>
                                )}
                            </>
                        )}
                        {open && inSettings && (
                            <>
                                {isAdmin && <SubLabel label="프로젝트" collapsed={collapsed}/>}
                                {isAdmin && PROJECT_SETTINGS.map((s) => {
                                    const path = `${base}/settings${s.suffix}`;
                                    const active = s.suffix === "" ? pathname === path : is(path);
                                    return <NavItem key={path} href={path} label={s.label} icon={Settings} active={active} collapsed={collapsed} indent/>;
                                })}
                                {space?.canManage && <SubLabel label={`작업 공간 · ${space.name}`} collapsed={collapsed}/>}
                                {space?.canManage && SPACE_SETTINGS.map((s) => {
                                    const path = `${base}/settings${s.suffix}`;
                                    return <NavItem key={path} href={withSpace(path)} label={s.label} icon={Settings} active={is(path)} collapsed={collapsed} indent/>;
                                })}
                            </>
                        )}
                    </div>
                );
            })}

            {addingSpace && projectId && (
                <CreateSpaceModal projectId={projectId} onClose={() => setAddingSpace(false)} onCreated={(sp) => setSpace(sp.id)}/>
            )}

            <Section label="필터" collapsed={collapsed}/>
            <NavItem href="/cira/search" label="검색" icon={Search} active={pathname === "/cira/search"} collapsed={collapsed}/>
            <NavItem href="/cira/search/advanced" label="고급 검색 (CQL)" icon={FileSearch} active={is("/cira/search/advanced")} collapsed={collapsed}/>
        </nav>
    );
}
