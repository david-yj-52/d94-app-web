"use client";

import type {ActionType, AutomationRule, CreateAutomationRuleRequest, TriggerType} from "@/lib/api/automation";
import {ACTION_LABEL, TRIGGER_LABEL} from "./AutomationRuleCard";
import {useEffect, useState} from "react";

const TRIGGER_TYPES: TriggerType[] = [
    "ISSUE_CREATED",
    "ISSUE_STATUS_CHANGED",
    "ISSUE_ASSIGNED",
    "ISSUE_PRIORITY_CHANGED",
    "COMMENT_ADDED",
    "SPRINT_STARTED",
    "SPRINT_COMPLETED",
];

const ACTION_TYPES: ActionType[] = [
    "SEND_NOTIFICATION",
    "CHANGE_STATUS",
    "ASSIGN_USER",
    "ADD_LABEL",
    "SEND_WEBHOOK",
];

const ACTION_PARAMS_PLACEHOLDER: Record<ActionType, string> = {
    SEND_NOTIFICATION: JSON.stringify({message: "이슈가 생성되었습니다."}, null, 2),
    CHANGE_STATUS: JSON.stringify({statusId: "uuid-of-target-status"}, null, 2),
    ASSIGN_USER: JSON.stringify({userId: "uuid-of-user"}, null, 2),
    ADD_LABEL: JSON.stringify({label: "긴급"}, null, 2),
    SEND_WEBHOOK: JSON.stringify({url: "https://hooks.example.com/notify"}, null, 2),
};

interface Props {
    rule?: AutomationRule | null;
    onSubmit: (data: CreateAutomationRuleRequest) => void;
    isPending: boolean;
    onClose: () => void;
}

export default function AutomationRuleModal({rule, onSubmit, isPending, onClose}: Props) {
    const [ruleName, setRuleName] = useState(rule?.ruleName ?? "");
    const [triggerType, setTriggerType] = useState<TriggerType>(
        rule?.triggerType ?? "ISSUE_CREATED",
    );
    const [actionType, setActionType] = useState<ActionType>(
        rule?.actionType ?? "SEND_NOTIFICATION",
    );
    const [actionParamsStr, setActionParamsStr] = useState(
        rule?.actionParams ? JSON.stringify(rule.actionParams, null, 2) : "",
    );
    const [isActive, setIsActive] = useState(rule?.isActive ?? true);
    const [paramsError, setParamsError] = useState("");

    useEffect(() => {
        if (!actionParamsStr) {
            setActionParamsStr(ACTION_PARAMS_PLACEHOLDER[actionType]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionType]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setParamsError("");

        let actionParams: Record<string, unknown> = {};
        if (actionParamsStr.trim()) {
            try {
                actionParams = JSON.parse(actionParamsStr);
            } catch {
                setParamsError("올바른 JSON 형식이 아닙니다.");
                return;
            }
        }

        onSubmit({
            ruleName: ruleName.trim(),
            triggerType,
            conditions: {},
            actionType,
            actionParams,
            isActive,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-900 mb-5">
                    {rule ? "규칙 수정" : "새 규칙 추가"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 규칙 이름 */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            규칙 이름
                        </label>
                        <input
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder="예: 이슈 생성 시 Slack 알림"
                            required
                            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* 트리거 타입 */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            트리거
                        </label>
                        <select
                            value={triggerType}
                            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {TRIGGER_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {TRIGGER_LABEL[t]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 액션 타입 */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            액션
                        </label>
                        <select
                            value={actionType}
                            onChange={(e) => {
                                const next = e.target.value as ActionType;
                                setActionType(next);
                                setActionParamsStr(ACTION_PARAMS_PLACEHOLDER[next]);
                            }}
                            className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ACTION_TYPES.map((a) => (
                                <option key={a} value={a}>
                                    {ACTION_LABEL[a]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 액션 파라미터 */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            액션 파라미터 (JSON)
                        </label>
                        <textarea
                            value={actionParamsStr}
                            onChange={(e) => {
                                setActionParamsStr(e.target.value);
                                setParamsError("");
                            }}
                            rows={5}
                            placeholder={ACTION_PARAMS_PLACEHOLDER[actionType]}
                            className={`w-full rounded-lg border bg-slate-50 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                paramsError ? "border-red-300" : "border-slate-200"
                            }`}
                        />
                        {paramsError && (
                            <p className="mt-1 text-xs text-red-500">{paramsError}</p>
                        )}
                    </div>

                    {/* 활성 여부 */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsActive((v) => !v)}
                            className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                                isActive ? "bg-blue-600" : "bg-slate-200"
                            }`}
                        >
              <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                      isActive ? "translate-x-4" : "translate-x-0"
                  }`}
              />
                        </button>
                        <span className="text-sm text-slate-600">
              {isActive ? "활성화 상태로 저장" : "비활성화 상태로 저장"}
            </span>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isPending ? "저장 중..." : rule ? "수정 저장" : "규칙 추가"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
