import {auth} from "@/auth";
import {redirect} from "next/navigation";
import Link from "next/link";

const MENU_ITEMS = [
    {
        href: "/todo",
        label: "Project Tasks",
        desc: "할 일 관리 · 팀 작업을 추적하고 목표를 달성하세요",
        icon: "📋",
        colorClass: "text-blue-600",
        bgClass: "bg-blue-50",
        borderClass: "border-blue-100",
        statLabel: "진행 중인 Task",
    },
    {
        href: "/mpms",
        label: "MPMS",
        desc: "플랫폼 및 제품 관리 · 다중 마켓플레이스 운영",
        icon: "🗂️",
        colorClass: "text-violet-600",
        bgClass: "bg-violet-50",
        borderClass: "border-violet-100",
        statLabel: "등록된 플랫폼",
    },
    {
        href: "#",
        label: "Analytics",
        desc: "Coming soon · 매출 및 성과 데이터 분석",
        icon: "📊",
        colorClass: "text-gray-400",
        bgClass: "bg-gray-50",
        borderClass: "border-gray-100",
        disabled: true,
    },
    {
        href: "#",
        label: "Settings",
        desc: "Coming soon · 계정 및 서비스 설정",
        icon: "⚙️",
        colorClass: "text-gray-400",
        bgClass: "bg-gray-50",
        borderClass: "border-gray-100",
        disabled: true,
    },
];

const STATS = [
    {label: "활성 플랫폼", value: "2", colorClass: "text-blue-600"},
    {label: "등록 제품", value: "3", colorClass: "text-violet-600"},
    {label: "진행 중 Task", value: "2", colorClass: "text-amber-500"},
    {label: "서비스 가동", value: "99.9%", colorClass: "text-green-500"},
];

export default async function HomePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? "좋은 아침이에요" : hour < 18 ? "안녕하세요" : "수고하셨어요";

    return (
        <div className="min-h-[calc(100vh-56px)] bg-gray-50 px-6 py-10">
            <div className="mx-auto max-w-3xl">
                {/* Welcome */}
                <div className="mb-10">
                    <p className="mb-1 text-sm text-gray-400">{greeting},</p>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        {session.user?.name} 님 👋
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        오늘도 TSHInc와 함께 빠르게 서비스를 만들어 보세요.
                    </p>
                </div>

                {/* Menu Grid */}
                <div className="mb-8 grid grid-cols-2 gap-4">
                    {MENU_ITEMS.map((item) =>
                            item.disabled ? (
                                <div
                                    key={item.label}
                                    className={`rounded-2xl border ${item.borderClass} bg-white p-6 opacity-50`}
                                >
                                    <div
                                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.bgClass}`}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="mb-1 flex items-center gap-2">
                                        <h2 className="text-base font-bold text-gray-400">
                                            {item.label}
                                        </h2>
                                        <span
                                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                    준비 중
                  </span>
                                    </div>
                                    <p className="text-sm text-gray-400">{item.desc}</p>
                                </div>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`group rounded-2xl border ${item.borderClass} bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md no-underline`}
                                >
                                    <div
                                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.bgClass}`}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="mb-1 flex items-center justify-between">
                                        <h2 className={`text-base font-bold text-gray-900`}>
                                            {item.label}
                                        </h2>
                                        <span
                                            className="text-lg text-gray-300 transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </Link>
                            )
                    )}
                </div>

                {/* Stats Bar */}
                <div className="rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
                    <div className="grid grid-cols-4 divide-x divide-gray-100">
                        {STATS.map((s) => (
                            <div key={s.label} className="px-4 text-center first:pl-0 last:pr-0">
                                <p className={`text-2xl font-bold tracking-tight ${s.colorClass}`}>
                                    {s.value}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
