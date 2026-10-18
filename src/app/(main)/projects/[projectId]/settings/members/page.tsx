"use client";

import AddMemberModal from "@/components/project/settings/AddMemberModal";
import MemberTable from "@/components/project/settings/MemberTable";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useProjectMembers} from "@/hooks/useProjectSettings";
import {useSession} from "next-auth/react";
import {use, useState} from "react";

export default function SettingsMembersPage({
                                                params,
                                            }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: session} = useSession();
    const {data: members, isLoading, isError} = useProjectMembers(projectId);
    const [showAdd, setShowAdd] = useState(false);
    const {show, ToastComponent} = useToast();

    const currentUserEmail = session?.user?.email;
    const isAdmin =
        currentUserEmail != null &&
        members?.some(
            (m) => m.email === currentUserEmail && m.role === "ADMIN",
        ) === true;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">멤버 관리</h2>
                    {members && (
                        <p className="text-sm text-slate-500 mt-1">총 {members.length}명</p>
                    )}
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAdd(true)}
                        className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 멤버 추가
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {Array.from({length: 4}).map((_, i) => (
                        <SkeletonRow key={i}/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="text-center py-16 text-slate-400 text-sm">
                    멤버 목록을 불러오는 데 실패했습니다.
                </div>
            )}

            {!isLoading && !isError && members && (
                <MemberTable
                    projectId={projectId}
                    members={members}
                    isAdmin={isAdmin}
                    currentUserEmail={currentUserEmail}
                    onSuccess={(msg) => show(msg)}
                    onError={(msg) => show(msg, "error")}
                />
            )}

            {showAdd && (
                <AddMemberModal
                    projectId={projectId}
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => show("멤버가 추가되었습니다.")}
                />
            )}

            {ToastComponent}
        </>
    );
}
