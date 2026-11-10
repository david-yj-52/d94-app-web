"use client";

import MilestoneCard from "@/components/milestone/MilestoneCard";
import MilestoneModal from "@/components/milestone/MilestoneModal";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import VersionCard from "@/components/version/VersionCard";
import VersionModal from "@/components/version/VersionModal";
import {useArchiveVersion, useDeleteVersion, useReleaseVersion, useVersions,} from "@/hooks/useVersions";
import {useDeleteMilestone, useMilestones} from "@/hooks/useMilestones";
import type {MilestoneResponse} from "@/types/milestone";
import type {VersionResponse} from "@/types/version";
import {use, useState} from "react";

type Tab = "versions" | "milestones";

export default function VersionsPage({
                                         params,
                                     }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {show, ToastComponent} = useToast();

    const [activeTab, setActiveTab] = useState<Tab>("versions");

    // Version state
    const [showCreateVersion, setShowCreateVersion] = useState(false);
    const [editVersion, setEditVersion] = useState<VersionResponse | null>(null);
    const [actionVersionId, setActionVersionId] = useState<string | null>(null);

    // Milestone state
    const [showCreateMilestone, setShowCreateMilestone] = useState(false);
    const [editMilestone, setEditMilestone] = useState<MilestoneResponse | null>(null);
    const [actionMilestoneId, setActionMilestoneId] = useState<string | null>(null);

    // Version queries & mutations
    const {
        data: versions,
        isLoading: versionsLoading,
        isError: versionsError,
    } = useVersions(projectId);
    const {mutate: releaseVersion, isPending: isReleasing} = useReleaseVersion(projectId);
    const {mutate: archiveVersion, isPending: isArchiving} = useArchiveVersion(projectId);
    const {mutate: deleteVersion, isPending: isDeletingVersion} = useDeleteVersion(projectId);

    // Milestone queries & mutations
    const {
        data: milestones,
        isLoading: milestonesLoading,
        isError: milestonesError,
    } = useMilestones(projectId);
    const {mutate: deleteMilestone, isPending: isDeletingMilestone} =
        useDeleteMilestone(projectId);

    const handleRelease = (versionId: string) => {
        setActionVersionId(versionId);
        releaseVersion(versionId, {
            onSuccess: () => show("버전이 릴리즈되었습니다."),
            onError: () => show("버전 릴리즈에 실패했습니다.", "error"),
            onSettled: () => setActionVersionId(null),
        });
    };

    const handleArchive = (versionId: string) => {
        setActionVersionId(versionId);
        archiveVersion(versionId, {
            onSuccess: () => show("버전이 아카이브되었습니다."),
            onError: () => show("버전 아카이브에 실패했습니다.", "error"),
            onSettled: () => setActionVersionId(null),
        });
    };

    const handleDeleteVersion = (versionId: string) => {
        if (!confirm("버전을 삭제하시겠습니까?")) return;
        setActionVersionId(versionId);
        deleteVersion(versionId, {
            onSuccess: () => show("버전이 삭제되었습니다."),
            onError: () => show("버전 삭제에 실패했습니다.", "error"),
            onSettled: () => setActionVersionId(null),
        });
    };

    const handleDeleteMilestone = (milestoneId: string) => {
        if (!confirm("마일스톤을 삭제하시겠습니까?")) return;
        setActionMilestoneId(milestoneId);
        deleteMilestone(milestoneId, {
            onSuccess: () => show("마일스톤이 삭제되었습니다."),
            onError: () => show("마일스톤 삭제에 실패했습니다.", "error"),
            onSettled: () => setActionMilestoneId(null),
        });
    };

    const tabClass = (tab: Tab) =>
        [
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
        ].join(" ");

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    <button className={tabClass("versions")} onClick={() => setActiveTab("versions")}>
                        버전
                    </button>
                    <button className={tabClass("milestones")} onClick={() => setActiveTab("milestones")}>
                        마일스톤
                    </button>
                </div>

                {activeTab === "versions" && (
                    <button
                        onClick={() => setShowCreateVersion(true)}
                        className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 새 버전
                    </button>
                )}
                {activeTab === "milestones" && (
                    <button
                        onClick={() => setShowCreateMilestone(true)}
                        className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 새 마일스톤
                    </button>
                )}
            </div>

            {/* Versions Tab */}
            {activeTab === "versions" && (
                <div className="space-y-4">
                    {versionsLoading &&
                        Array.from({length: 3}).map((_, i) => <SkeletonCard key={i}/>)}

                    {versionsError && (
                        <div className="text-center py-20 text-slate-400">
                            버전을 불러오는 데 실패했습니다.
                        </div>
                    )}

                    {!versionsLoading && !versionsError && versions?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <p className="text-lg font-medium text-slate-600 mb-1">버전이 없습니다.</p>
                            <p className="text-sm mb-6">새 버전을 생성해서 릴리즈를 관리하세요.</p>
                            <button
                                onClick={() => setShowCreateVersion(true)}
                                className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                + 새 버전
                            </button>
                        </div>
                    )}

                    {versions &&
                        versions.length > 0 &&
                        versions.map((v) => (
                            <VersionCard
                                key={v.id}
                                version={v}
                                onEdit={setEditVersion}
                                onDelete={handleDeleteVersion}
                                onRelease={handleRelease}
                                onArchive={handleArchive}
                                isActioning={
                                    (isReleasing || isArchiving || isDeletingVersion) && actionVersionId === v.id
                                }
                            />
                        ))}
                </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
                <div className="space-y-4">
                    {milestonesLoading &&
                        Array.from({length: 3}).map((_, i) => <SkeletonCard key={i}/>)}

                    {milestonesError && (
                        <div className="text-center py-20 text-slate-400">
                            마일스톤을 불러오는 데 실패했습니다.
                        </div>
                    )}

                    {!milestonesLoading && !milestonesError && milestones?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <p className="text-lg font-medium text-slate-600 mb-1">마일스톤이 없습니다.</p>
                            <p className="text-sm mb-6">새 마일스톤을 생성해서 목표를 관리하세요.</p>
                            <button
                                onClick={() => setShowCreateMilestone(true)}
                                className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                            >
                                + 새 마일스톤
                            </button>
                        </div>
                    )}

                    {milestones &&
                        milestones.length > 0 &&
                        milestones.map((m) => (
                            <MilestoneCard
                                key={m.id}
                                milestone={m}
                                onEdit={setEditMilestone}
                                onDelete={handleDeleteMilestone}
                                isDeleting={isDeletingMilestone && actionMilestoneId === m.id}
                            />
                        ))}
                </div>
            )}

            {/* Version Modals */}
            {showCreateVersion && (
                <VersionModal
                    projectId={projectId}
                    onClose={() => setShowCreateVersion(false)}
                    onSuccess={() => show("버전이 생성되었습니다.")}
                />
            )}
            {editVersion && (
                <VersionModal
                    projectId={projectId}
                    editTarget={editVersion}
                    onClose={() => setEditVersion(null)}
                    onSuccess={() => show("버전이 수정되었습니다.")}
                />
            )}

            {/* Milestone Modals */}
            {showCreateMilestone && (
                <MilestoneModal
                    projectId={projectId}
                    onClose={() => setShowCreateMilestone(false)}
                    onSuccess={() => show("마일스톤이 생성되었습니다.")}
                />
            )}
            {editMilestone && (
                <MilestoneModal
                    projectId={projectId}
                    editTarget={editMilestone}
                    onClose={() => setEditMilestone(null)}
                    onSuccess={() => show("마일스톤이 수정되었습니다.")}
                />
            )}

            {ToastComponent}
        </>
    );
}
