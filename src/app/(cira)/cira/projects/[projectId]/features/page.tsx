"use client";

import FeatureTree from "@/components/issue/FeatureTree";
import PageHeader from "@/components/cira/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import {Select} from "@/components/ui/Input";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useProject} from "@/hooks/useProjects";
import {useFeatures, useSpaces} from "@/hooks/useSpaces";
import {use, useState} from "react";

/** 전체 통합: 공통 Feature(항상 위) → 그 아래 단위 Feature → 공통에 안 묶인 단위 Feature */
export default function FeaturesPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const {data: project} = useProject(projectId);
    const {data: spaces = []} = useSpaces(projectId);
    const [spaceId, setSpaceId] = useState("");
    const {data: nodes, isLoading} = useFeatures(projectId, spaceId || null);

    return (
        <div className="mx-auto max-w-6xl px-4">
            <PageHeader
                breadcrumbs={[{label: "프로젝트", href: "/cira/projects"}, {label: project?.name ?? "..."}]}
                title="Feature (전체 통합)"
                actions={
                    <Select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} aria-label="작업 공간 필터" className="w-48">
                        <option value="">모든 작업 공간</option>
                        {spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                }
            />
            {isLoading ? (
                <div className="space-y-2"><SkeletonRow/><SkeletonRow/><SkeletonRow/></div>
            ) : !nodes?.length ? (
                <EmptyState>아직 Feature 가 없습니다. Task 생성에서 유형을 Feature 로 고르세요 (공통 Feature 는 여러 공간을 아우릅니다).</EmptyState>
            ) : (
                <FeatureTree projectId={projectId} nodes={nodes} spaces={spaces}/>
            )}
        </div>
    );
}
