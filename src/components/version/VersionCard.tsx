"use client";

import {useState} from "react";
import type {VersionResponse, VersionStatus} from "@/types/version";
import ReleaseNotesModal from "./ReleaseNotesModal";

const STATUS_LABEL: Record<VersionStatus, string> = {
    PLANNING: "계획 중",
    ACTIVE: "진행 중",
    RELEASED: "릴리즈됨",
    ARCHIVED: "아카이브됨",
};

const STATUS_COLOR: Record<VersionStatus, string> = {
    PLANNING: "bg-slate-100 text-slate-600",
    ACTIVE: "bg-blue-100 text-blue-700",
    RELEASED: "bg-green-100 text-green-700",
    ARCHIVED: "bg-slate-200 text-slate-500",
};

function formatDate(dt?: string | null) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("ko-KR");
}

interface Props {
    version: VersionResponse;
    onEdit: (version: VersionResponse) => void;
    onDelete: (versionId: string) => void;
    onRelease: (versionId: string) => void;
    onArchive: (versionId: string) => void;
    isActioning?: boolean;
}

export default function VersionCard({
                                        version,
                                        onEdit,
                                        onDelete,
                                        onRelease,
                                        onArchive,
                                        isActioning,
                                    }: Props) {
    const [showReleaseNotes, setShowReleaseNotes] = useState(false);

    return (
        <>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-slate-900">{version.versionName}</h3>
                            <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[version.status]}`}
                            >
                {STATUS_LABEL[version.status]}
              </span>
                        </div>

                        {version.description && (
                            <p className="text-sm text-slate-500 mt-1">{version.description}</p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>예정 릴리즈: {formatDate(version.plannedReleaseDate)}</span>
                            {version.releasedAt && (
                                <span>릴리즈일: {formatDate(version.releasedAt)}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {version.status === "ACTIVE" && (
                            <button
                                onClick={() => onRelease(version.id)}
                                disabled={isActioning}
                                className="h-8 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                            >
                                릴리즈
                            </button>
                        )}
                        {version.status === "RELEASED" && (
                            <button
                                onClick={() => setShowReleaseNotes(true)}
                                className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                            >
                                릴리즈 노트
                            </button>
                        )}
                        {version.status !== "ARCHIVED" && version.status !== "RELEASED" && (
                            <button
                                onClick={() => onEdit(version)}
                                className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                            >
                                수정
                            </button>
                        )}
                        {version.status === "RELEASED" && (
                            <button
                                onClick={() => onArchive(version.id)}
                                disabled={isActioning}
                                className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                            >
                                아카이브
                            </button>
                        )}
                        {version.status !== "RELEASED" && version.status !== "ARCHIVED" && (
                            <button
                                onClick={() => onDelete(version.id)}
                                disabled={isActioning}
                                className="h-8 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 disabled:opacity-60"
                            >
                                삭제
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showReleaseNotes && (
                <ReleaseNotesModal
                    versionId={version.id}
                    versionName={version.versionName}
                    onClose={() => setShowReleaseNotes(false)}
                />
            )}
        </>
    );
}
