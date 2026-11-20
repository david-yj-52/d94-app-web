"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {Suspense} from "react";
import EmptyGroupPanel from "@/components/settings/EmptyGroupPanel";
import GeneralSettingsPanel from "@/components/settings/GeneralSettingsPanel";
import SettingsNav from "@/components/settings/SettingsNav";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useIsAdmin} from "@/hooks/useSettings";
import {DEFAULT_GROUP, SETTING_GROUPS} from "./groups";

function SettingsScreen() {
    const router = useRouter();
    const params = useSearchParams();
    const isAdmin = useIsAdmin();
    const group = SETTING_GROUPS.find((g) => g.id === params.get("group"))
        ?? SETTING_GROUPS.find((g) => g.id === DEFAULT_GROUP)!;
    const Icon = group.icon;

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row">
            <SettingsNav groups={SETTING_GROUPS} activeId={group.id}
                         onSelect={(id) => router.replace(`/settings?group=${id}`)}/>
            <div className="min-w-0 flex-1 space-y-4">
                <header className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-8 text-center">
                    <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-500 text-white">
                        <Icon className="h-8 w-8" aria-hidden/>
                    </span>
                    <h1 className="text-2xl font-bold text-slate-900">{group.label}</h1>
                    <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                </header>
                {group.id === "general"
                    ? <GeneralSettingsPanel readOnly={!isAdmin}/>
                    : <EmptyGroupPanel group={group}/>}
            </div>
        </div>
    );
}

/** 기준정보 설정. 선택한 그룹은 ?group= 에 둔다 (useSearchParams 는 Suspense 필요) */
export default function SettingsPage() {
    return <Suspense fallback={<div className="mx-auto max-w-6xl px-4"><SkeletonCard/></div>}><SettingsScreen/></Suspense>;
}
