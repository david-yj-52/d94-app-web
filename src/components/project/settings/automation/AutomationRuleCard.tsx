"use client";

import {useDeleteAutomationRule, useRuleExecutions, useUpdateAutomationRule} from "@/hooks/useAutomation";
import type {ActionType, AutomationRule, TriggerType} from "@/lib/api/automation";
import {useState} from "react";

export const TRIGGER_LABEL: Record<TriggerType, string> = {
    ISSUE_CREATED: "이슈 생성됨",
    ISSUE_STATUS_CHANGED: "상태 변경됨",
    ISSUE_ASSIGNED: "담당자 지정됨",
    ISSUE_PRIORITY_CHANGED: "우선순위 변경됨",
    COMMENT_ADDED: "댓글 추가됨",
    SPRINT_STARTED: "스프린트 시작됨",
    SPRINT_COMPLETED: "스프린트 완료됨",
};

export const ACTION_LABEL: Record<ActionType, string> = {
    SEND_NOTIFICATION: "알림 발송",
    CHANGE_STATUS: "상태 변경",
    ASSIGN_USER: "담당자 지정",
    ADD_LABEL: "라벨 추가",
    SEND_WEBHOOK: "Webhook 발송",
};

const EXECUTION_STATUS_STYLE: Record<string, string> = {
    SUCCESS: "bg-green-100 text-green-700",
    FAILURE: "bg-red-100 text-red-700",
    SKIPPED: "bg-slate-100 text-slate-500",
};

interface Props {
    rule: AutomationRule;
    projectId: string;
    onEdit: (rule: AutomationRule) => void;
    onDeleted: () => void;
}

export default function AutomationRuleCard({rule, projectId, onEdit, onDeleted}: Props) {
    const [showExecutions, setShowExecutions] = useState(false);
    const {data: executions, isLoading: execLoading} = useRuleExecutions(
        showExecutions ? rule.id : "",
    );
    const {mutate: updateRule, isPending: isToggling} = useUpdateAutomationRule(projectId);
    const {mutate: deleteRule} = useDeleteAutomationRule(projectId);

    const handleToggle = () => {
        updateRule(
            {ruleId: rule.id, data: {isActive: !rule.isActive}},
            {
                onError: () => {
                }
            },
        );
    };

    const handleDelete = () => {
        if (!confirm(`"${rule.ruleName}" 규칙을 삭제하시겠습니까?`)) return;
        deleteRule(rule.id, {onSuccess: onDeleted});
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* 활성 토글 */}
                    <button
                        onClick={handleToggle}
                        disabled={isToggling}
                        aria-label={rule.isActive ? "비활성화" : "활성화"}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-60 ${
                            rule.isActive ? "bg-blue-600" : "bg-slate-200"
                        }`}
                    >
            <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    rule.isActive ? "translate-x-4" : "translate-x-0"
                }`}
            />
                    </button>

                    <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{rule.ruleName}</p>
                        <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {TRIGGER_LABEL[rule.triggerType] ?? rule.triggerType}
              </span>
                            <span className="text-xs text-slate-400">→</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                {ACTION_LABEL[rule.actionType] ?? rule.actionType}
              </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowExecutions((v) => !v)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                    >
                        {showExecutions ? "이력 닫기" : "이력 보기"}
                    </button>
                    <button
                        onClick={() => onEdit(rule)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                    >
                        수정
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-xs text-red-400 hover:text-red-600"
                    >
                        삭제
                    </button>
                </div>
            </div>

            {/* 실행 이력 패널 */}
            {showExecutions && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold text-slate-500 mb-2">실행 이력</p>
                    {execLoading && (
                        <p className="text-xs text-slate-400">불러오는 중...</p>
                    )}
                    {!execLoading && (!executions || executions.length === 0) && (
                        <p className="text-xs text-slate-400">실행 이력이 없습니다.</p>
                    )}
                    <div className="space-y-1">
                        {executions?.map((exec) => (
                            <div
                                key={exec.id}
                                className="flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-2">
                  <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${EXECUTION_STATUS_STYLE[exec.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {exec.status === "SUCCESS"
                        ? "성공"
                        : exec.status === "FAILURE"
                            ? "실패"
                            : "건너뜀"}
                  </span>
                                    {exec.detail && (
                                        <span className="text-slate-500 truncate max-w-48">{exec.detail}</span>
                                    )}
                                </div>
                                <span className="text-slate-400 shrink-0 ml-2">
                  {new Date(exec.triggeredAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                  })}
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
