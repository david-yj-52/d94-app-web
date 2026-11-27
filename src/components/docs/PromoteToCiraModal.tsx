"use client";

import {useSpaces} from "@/hooks/useSpaces";
import {useState} from "react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import {Input, Select} from "@/components/ui/Input";

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
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title="CIRA Task로 등록">
            <form className="space-y-4 p-4" onSubmit={(e) => {
                e.preventDefault();
                if (projectId && title.trim()) onSubmit({projectId, issueTypeId: issueTypeId || issueTypes[0]?.id || "", title: title.trim(), spaceId: spaceId || undefined});
            }}>
                <p className="text-xs text-slate-500">Task의 메인 문서가 프로젝트 팀 Docs에 만들어지고, 이 노트가 원본으로 연결됩니다.</p>
                {projects.length === 0 ? (
                    <EmptyState size="sm">멤버로 속한 CIRA 프로젝트가 없습니다.</EmptyState>
                ) : (
                    <>
                        <FormField label="프로젝트">
                            <Select value={projectId} onChange={(e) => {
                                setProjectId(e.target.value);
                                setSpaceId("");
                            }}>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="작업 공간">
                            <Select value={spaceId} onChange={(e) => setSpaceId(e.target.value)}>
                                {spaces.map((sp) => <option key={sp.id} value={sp.isDefault ? "" : sp.id}>{sp.name}{sp.isDefault ? " (기본)" : ""}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="Task 타입">
                            <Select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)}>
                                {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="Task 제목">
                            <Input value={title} onChange={(e) => setTitle(e.target.value)}/>
                        </FormField>
                    </>
                )}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>취소</Button>
                    <Button type="submit" className="flex-1" disabled={saving || !projectId || !title.trim()}>등록</Button>
                </div>
            </form>
        </Dialog>
    );
}
