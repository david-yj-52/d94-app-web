"use client";

import {useState} from "react";
import TaskBoard from "@/components/docs/TaskBoard";
import {useDocsTasks, useSetDocsTaskStatus} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {Skeleton} from "@/components/ui/Skeleton";
import {docsError} from "@/lib/docs/error";
import type {TaskFilters} from "@/types/docs";

/** 모든 노트의 체크박스 줄 모아보기 (Obsidian Tasks 플러그인처럼). 필터: 태그·트랙·마감 */
export default function DocsTasksPage() {
    const [filters, setFilters] = useState<TaskFilters>({});
    const tasks = useDocsTasks(filters);
    const setStatus = useSetDocsTaskStatus();
    const {show, ToastComponent} = useToast();
    const field = (key: keyof TaskFilters, label: string, type = "text") => (
        <label className="text-xs font-medium text-slate-600">{label}
            <input type={type} value={filters[key] ?? ""} aria-label={label}
                   onChange={(e) => setFilters((f) => ({...f, [key]: e.target.value || undefined}))}
                   className="mt-1 block h-8 w-36 rounded-lg border border-slate-200 px-2 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </label>
    );
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
            <h1 className="text-xl font-semibold text-slate-900">Task</h1>
            <p className="mt-1 text-sm text-slate-500">노트 본문의 <code className="rounded bg-slate-100 px-1">- [ ]</code> 줄을 모아 봅니다. 상태를 바꾸면 원 노트의 그 줄이 바뀝니다.</p>
            <div className="mb-4 mt-4 flex flex-wrap gap-3">
                {field("tag", "태그")}
                {field("stream", "트랙")}
                {field("dueBefore", "마감 (이날까지)", "date")}
            </div>
            {tasks.isLoading ? <Skeleton className="h-48"/> : (
                <TaskBoard tasks={tasks.data ?? []} onStatus={(t, status) => setStatus.mutate({noteId: t.noteId, lineNo: t.lineNo, status},
                    {onError: (e) => show(docsError(e, "Task 를 바꾸지 못했습니다."), "error")})}/>
            )}
            {ToastComponent}
        </div>
    );
}
