import {auth} from "@/auth";
import {redirect} from "next/navigation";
import Link from "next/link";
import {
    ArrowLeftRight,
    Bell,
    ChevronRight,
    FolderKanban,
    LayoutDashboard,
    ListTodo,
    type LucideIcon,
    Package,
    Radio,
    Search,
} from "lucide-react";

type FeatureItem = {
    href: string;
    label: string;
    desc: string;
    icon: LucideIcon;
    iconClass: string;
};

const FEATURE_GROUPS: { title: string; desc: string; items: FeatureItem[] }[] = [
    {
        title: "CIRA",
        desc: "이슈 · 프로젝트 관리",
        items: [
            {
                href: "/projects",
                label: "프로젝트",
                desc: "프로젝트 목록과 생성. 이슈 · 보드 · 스프린트 · 리포트 · 위키로 들어갑니다.",
                icon: FolderKanban,
                iconClass: "bg-blue-50 text-blue-600",
            },
            {
                href: "/dashboard",
                label: "내 대시보드",
                desc: "나에게 할당된 이슈, 오늘 마감, 최근 활동, 현재 스프린트를 한눈에 봅니다.",
                icon: LayoutDashboard,
                iconClass: "bg-indigo-50 text-indigo-600",
            },
            {
                href: "/search",
                label: "검색",
                desc: "키워드 · 필터로 이슈를 찾고, 고급 검색(CQL)과 저장 필터를 씁니다.",
                icon: Search,
                iconClass: "bg-sky-50 text-sky-600",
            },
            {
                href: "/notifications",
                label: "알림",
                desc: "받은 알림 목록을 확인하고 읽음 처리합니다.",
                icon: Bell,
                iconClass: "bg-amber-50 text-amber-600",
            },
        ],
    },
    {
        title: "실험 모듈",
        desc: "기능 실험 · 테스트",
        items: [
            {
                href: "/todo",
                label: "Tasks",
                desc: "Server Actions 로 만든 할 일 목록입니다.",
                icon: ListTodo,
                iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
                href: "/mpms",
                label: "MPMS",
                desc: "플랫폼과 제품을 마스터-디테일로 관리합니다.",
                icon: Package,
                iconClass: "bg-violet-50 text-violet-600",
            },
            {
                href: "/solace",
                label: "Solace",
                desc: "Solace WebSocket 메시지 송수신을 테스트합니다.",
                icon: Radio,
                iconClass: "bg-rose-50 text-rose-600",
            },
            {
                href: "/interface-test",
                label: "인터페이스 테스트",
                desc: "GET · POST · PUT · PATCH · DELETE 로 UI → UMD → 백엔드 → DB 통신을 확인합니다.",
                icon: ArrowLeftRight,
                iconClass: "bg-teal-50 text-teal-600",
            },
        ],
    },
];

export default async function HomePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "좋은 아침이에요" : hour < 18 ? "안녕하세요" : "수고하셨어요";

    return (
        <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-5xl">
                {/* Welcome */}
                <div className="mb-10">
                    <p className="mb-1 text-sm text-slate-400">{greeting},</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {session.user?.name} 님
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        사용할 기능을 선택하세요.
                    </p>
                </div>

                {/* Feature Groups */}
                <div className="space-y-10">
                    {FEATURE_GROUPS.map((group) => (
                        <section key={group.title}>
                            <div className="mb-4 flex items-baseline gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{group.title}</h2>
                                <span className="text-sm text-slate-400">{group.desc}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {group.items.map(({href, label, desc, icon: Icon, iconClass}) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md no-underline"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <div
                                                className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
                                            >
                                                <Icon className="h-5 w-5"/>
                                            </div>
                                            <ChevronRight
                                                className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"/>
                                        </div>
                                        <h3 className="mb-1 text-base font-bold text-slate-900">{label}</h3>
                                        <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}
