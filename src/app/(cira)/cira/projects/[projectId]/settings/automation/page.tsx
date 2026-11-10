"use client";

import AutomationRuleCard from "@/components/project/settings/automation/AutomationRuleCard";
import AutomationRuleModal from "@/components/project/settings/automation/AutomationRuleModal";
import {useToast} from "@/components/ui/Toast";
import {useAutomationRules, useCreateAutomationRule, useUpdateAutomationRule,} from "@/hooks/useAutomation";
import type {AutomationRule, CreateAutomationRuleRequest} from "@/lib/api/automation";
import {use, useState} from "react";

export default function SettingsAutomationPage({
                                                   params,
                                               }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: rules, isLoading} = useAutomationRules(projectId);
    const {mutate: createRule, isPending: isCreating} = useCreateAutomationRule(projectId);
    const {mutate: updateRule, isPending: isUpdating} = useUpdateAutomationRule(projectId);
    const {show, ToastComponent} = useToast();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

    const openCreate = () => {
        setEditingRule(null);
        setModalOpen(true);
    };

    const openEdit = (rule: AutomationRule) => {
        setEditingRule(rule);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingRule(null);
    };

    const handleSubmit = (data: CreateAutomationRuleRequest) => {
        if (editingRule) {
            updateRule(
                {ruleId: editingRule.id, data},
                {
                    onSuccess: () => {
                        closeModal();
                        show("규칙이 수정되었습니다.");
                    },
                    onError: () => show("수정에 실패했습니다.", "error"),
                },
            );
        } else {
            createRule(data, {
                onSuccess: () => {
                    closeModal();
                    show("규칙이 추가되었습니다.");
                },
                onError: () => show("규칙 추가에 실패했습니다.", "error"),
            });
        }
    };

    return (
        <>
            {/* 헤더 */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">자동화</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        이슈 이벤트에 자동으로 반응하는 규칙을 설정합니다.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="shrink-0 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                    + 새 규칙
                </button>
            </div>

            {/* 로딩 */}
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse"/>
                    ))}
                </div>
            )}

            {/* 빈 상태 */}
            {!isLoading && (!rules || rules.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-4xl mb-3">⚡</div>
                    <p className="text-slate-600 font-medium">자동화 규칙이 없습니다.</p>
                    <p className="text-sm text-slate-400 mt-1">
                        규칙을 추가하면 이슈 이벤트에 자동으로 반응합니다.
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-4 h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        첫 규칙 추가하기
                    </button>
                </div>
            )}

            {/* 규칙 목록 */}
            {!isLoading && rules && rules.length > 0 && (
                <div className="space-y-3">
                    {rules.map((rule) => (
                        <AutomationRuleCard
                            key={rule.id}
                            rule={rule}
                            projectId={projectId}
                            onEdit={openEdit}
                            onDeleted={() => show("규칙이 삭제되었습니다.")}
                        />
                    ))}
                </div>
            )}

            {/* 모달 */}
            {modalOpen && (
                <AutomationRuleModal
                    rule={editingRule}
                    onSubmit={handleSubmit}
                    isPending={isCreating || isUpdating}
                    onClose={closeModal}
                />
            )}

            {ToastComponent}
        </>
    );
}
