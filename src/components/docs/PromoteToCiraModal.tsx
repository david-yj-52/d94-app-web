"use client";

import {useSpaces} from "@/hooks/useSpaces";
import {useState} from "react";
import Button from "@/components/ui/Button";

interface Option {
    id: string;
    label: string;
}

interface PromoteToCiraModalProps {
    noteTitle: string;
    /** 내가 멤버인 CIRA 프로젝트 */
    projects: Option[];
    issueTypes: Option[];
    saving?: boolean;
    /** spaceId 없음 = 기본 작업 공간 */
    onSubmit: (req: { projectId: string; issueTypeId: string; title: string; spaceId?: string }) => void;
    onClose: () => void;
}

/** 노트 → CIRA Task: 프로젝트·작업 공간·Task 타입·제목(기본 노트 제목)을 고른다. 서버가 Task 메인 노트에 origin 으로 이 노트를 건다 */
export default function PromoteToCiraModal({noteTitle, projects, issueTypes, saving, onSubmit, onClose}: PromoteToCiraModalProps) {
    const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
    const [issueTypeId, setIssueTypeId] = useState(issueTypes[0]?.id ?? "");
    const [title, setTitle] = useState(noteTitle);
    // V650: Task 는 작업 공간에 속한다. 비우면 기본 공간
    const {data: spaces = []} = useSpaces(projectId || undefined);
    const [spaceId, setSpaceId] = useState("");
    const field = "mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <form className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => {
                      e.preventDefault();
                      if (projectId && title.trim()) onSubmit({projectId, issueTypeId: issueTypeId || issueTypes[0]?.id || "", title: title.trim(), spaceId: spaceId || undefined});
                  }}>
                <h2 className="text-base font-semibold text-slate-900">CIRA Task로 등록</h2>
                <p className="text-xs text-slate-500">Task의 메인 문서가 프로젝트 팀 Docs에 만들어지고, 이 노트가 원본으로 연결됩니다.</p>
                {projects.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">멤버로 속한 CIRA 프로젝트가 없습니다.</p>
                ) : (
                    <>
                        <label className="block text-xs font-medium text-slate-600">프로젝트
                            <select value={projectId} onChange={(e) => {
                                setProjectId(e.target.value);
                                setSpaceId("");
                            }} className={field}>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-600">작업 공간
                            <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className={field}>
                                {spaces.map((sp) => <option key={sp.id} value={sp.isDefault ? "" : sp.id}>{sp.name}{sp.isDefault ? " (기본)" : ""}</option>)}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-600">Task 타입
                            <select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)} className={field}>
                                {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-600">Task 제목
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} px-3`}/>
                        </label>
                    </>
                )}
                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" onClick={onClose} variant="ghost">취소</Button>
                    <Button type="submit" disabled={saving || !projectId || !title.trim()}
                            className="font-medium">등록</Button>
                </div>
            </form>
        </div>
    );
}
