"use client";

import Dialog from "@/components/cira/ui/Dialog";
import CreateIssueModal from "@/components/issue/CreateIssueModal";
import {useProjects} from "@/hooks/useProjects";
import {Plus} from "lucide-react";
import {useState} from "react";

// 프로젝트 안이면 바로 이슈 생성, 밖이면 프로젝트부터 고른다
export default function CreateIssueButton({projectId}: { projectId?: string }) {
    const [step, setStep] = useState<"closed" | "pick" | "form">("closed");
    const [picked, setPicked] = useState<string>();
    const {data: projects = []} = useProjects();
    const target = projectId ?? picked;

    return (
        <>
            <button
                onClick={() => setStep(projectId ? "form" : "pick")}
                className="flex h-9 items-center gap-1 rounded-md bg-cira-brand px-3 text-sm font-semibold text-white hover:opacity-90"
                aria-label="이슈 만들기"
            >
                <Plus className="h-4 w-4"/>
                <span className="hidden sm:inline">만들기</span>
            </button>

            <Dialog open={step === "pick"} onOpenChange={(o) => !o && setStep("closed")} title="이슈를 만들 프로젝트">
                <ul className="p-2">
                    {projects.length === 0 && <li className="p-3 text-sm text-cira-muted">프로젝트가 없습니다.</li>}
                    {projects.map((p) => (
                        <li key={p.id}>
                            <button
                                onClick={() => {
                                    setPicked(p.id);
                                    setStep("form");
                                }}
                                className="flex min-h-10 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-cira-brand-soft"
                            >
                                <span className="font-mono text-xs text-cira-muted">{p.key}</span>
                                {p.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </Dialog>

            {step === "form" && target && (
                <CreateIssueModal projectId={target} onClose={() => setStep("closed")}/>
            )}
        </>
    );
}
