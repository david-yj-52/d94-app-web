"use client";

import {useToast} from "@/components/ui/Toast";
import {useAttachments, useDeleteAttachment, useUploadAttachment,} from "@/hooks/useAttachments";
import {formatFileSize, getDownloadUrl} from "@/lib/api/attachments";
import {Download, File, FileImage, FileText, Paperclip, Trash2, Upload,} from "lucide-react";
import {useCallback, useRef, useState} from "react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = [
    "image/*",
    "application/pdf",
    "text/*",
    "application/zip",
    "application/json",
    "application/vnd.openxmlformats-officedocument.*",
    "application/msword",
    "application/vnd.ms-excel",
];

function FileIcon({mimeType}: { mimeType: string }) {
    if (mimeType.startsWith("image/"))
        return <FileImage className="h-4 w-4 text-blue-500"/>;
    if (mimeType === "application/pdf")
        return <FileText className="h-4 w-4 text-red-500"/>;
    return <File className="h-4 w-4 text-slate-400"/>;
}

interface UploadProgress {
    file: File;
    percent: number;
}

export function AttachmentSection({issueId}: { issueId: string }) {
    const {show, ToastComponent} = useToast();
    const {data: attachments, isLoading} = useAttachments(issueId);
    const {mutate: upload} = useUploadAttachment(issueId);
    const {mutate: remove, isPending: isRemoving} = useDeleteAttachment(issueId);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<UploadProgress[]>([]);
    const [dragging, setDragging] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            const list = Array.from(files);
            const oversized = list.filter((f) => f.size > MAX_FILE_SIZE);
            if (oversized.length > 0) {
                show(
                    `${oversized.map((f) => f.name).join(", ")} 파일이 50 MB를 초과합니다.`,
                    "error",
                );
                return;
            }

            list.forEach((file) => {
                const entry: UploadProgress = {file, percent: 0};
                setUploading((prev) => [...prev, entry]);

                upload(
                    {
                        file,
                        onProgress: (percent) => {
                            setUploading((prev) =>
                                prev.map((u) => (u.file === file ? {...u, percent} : u)),
                            );
                        },
                    },
                    {
                        onSuccess: () => {
                            setUploading((prev) => prev.filter((u) => u.file !== file));
                            show(`${file.name} 업로드 완료`);
                        },
                        onError: () => {
                            setUploading((prev) => prev.filter((u) => u.file !== file));
                            show(`${file.name} 업로드 실패`, "error");
                        },
                    },
                );
            });
        },
        [upload, show],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles],
    );

    const handleDelete = (attachmentId: string) => {
        remove(attachmentId, {
            onSuccess: () => {
                setDeleteTargetId(null);
                show("파일이 삭제되었습니다.");
            },
            onError: () => show("파일 삭제에 실패했습니다.", "error"),
        });
    };

    const allUploading = uploading.length > 0;

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4"/>
                    첨부파일
                    {attachments && attachments.length > 0 && (
                        <span className="ml-1 text-slate-400 font-normal">
              ({attachments.length})
            </span>
                    )}
                </h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <Upload className="h-3.5 w-3.5"/>
                    파일 추가
                </button>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl transition-colors mb-3 ${
                    dragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-slate-50/50"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files) handleFiles(e.target.files);
                        e.target.value = "";
                    }}
                />

                {/* Upload progress bars */}
                {allUploading && (
                    <div className="p-3 space-y-2">
                        {uploading.map((u, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span className="truncate max-w-[200px]">{u.file.name}</span>
                                    <span>{u.percent}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-200"
                                        style={{width: `${u.percent}%`}}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!allUploading && (
                    <div
                        className="py-5 text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="h-5 w-5 text-slate-300 mx-auto mb-1.5"/>
                        <p className="text-xs text-slate-400">
                            드래그 앤 드롭 또는 클릭하여 파일 첨부
                        </p>
                        <p className="text-xs text-slate-300 mt-0.5">최대 50 MB</p>
                    </div>
                )}
            </div>

            {/* File list */}
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-10 animate-pulse bg-slate-100 rounded-lg"
                        />
                    ))}
                </div>
            ) : attachments && attachments.length > 0 ? (
                <ul className="space-y-1.5">
                    {attachments.map((att) => (
                        <li
                            key={att.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200 group hover:border-slate-300 transition-colors"
                        >
                            <FileIcon mimeType={att.mimeType}/>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">
                                    {att.fileName}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {formatFileSize(att.fileSize)} ·{" "}
                                    {new Date(att.uploadedAt).toLocaleDateString("ko-KR")}
                                </p>
                            </div>
                            <div
                                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={getDownloadUrl(att.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="다운로드"
                                >
                                    <Download className="h-3.5 w-3.5"/>
                                </a>
                                <button
                                    onClick={() => setDeleteTargetId(att.id)}
                                    className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    title="삭제"
                                >
                                    <Trash2 className="h-3.5 w-3.5"/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                !allUploading && (
                    <p className="text-xs text-slate-400 text-center py-2">
                        첨부된 파일이 없습니다.
                    </p>
                )
            )}

            {/* Delete confirm modal */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeleteTargetId(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            파일 삭제
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            이 파일을 삭제하시겠습니까? 되돌릴 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTargetId(null)}
                                className="flex-1 h-9 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => handleDelete(deleteTargetId)}
                                disabled={isRemoving}
                                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                            >
                                {isRemoving ? "삭제 중..." : "삭제"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ToastComponent}
        </div>
    );
}
