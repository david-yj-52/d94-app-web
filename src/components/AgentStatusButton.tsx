"use client";

import {agentApi} from "@/lib/agent-api-";
import {useState} from "react";

export default function AgentStatusButton() {
    const [status, setStatus] = useState<
        "idle" | "loading" | "online" | "offline"
    >("idle");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleCheckStatus = async () => {
        setStatus("loading");
        setErrorMsg(null);

        const isAlive = await agentApi.checkStatus();
        if (isAlive) {
            setStatus("online");
        } else {
            setStatus("offline");
            setErrorMsg(
                "에이전트가 꺼져있거나, 브라우저에서 '안전하지 않은 콘텐츠 허용' 설정이 필요합니다. "
            );
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 border rounded-2xl bg-white shadow-sm">
            <div className="flex items-center gap-3">
                {/* 상태 표시 인디케이터 */}
                <div
                    className={`w-3 h-3 rounded-full ${
                        status === "online"
                            ? "bg-green-500 animate-pulse"
                            : status === "offline"
                                ? "bg-red-500"
                                : "bg-gray-300"
                    }`}
                />

                <span className="font-medium text-gray-700">
          로컬 에이전트 :{" "}
                    {status === "online"
                        ? "연결됨"
                        : status === "offline"
                            ? "연결 끊김"
                            : "확인 필요"}
        </span>
            </div>
            <button
                onClick={handleCheckStatus}
                disabled={status === "loading"}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    status === "loading"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                }`}
            >
                {status === "loading" ? "확인 중..." : "상태 다시 체크"}
            </button>
            {status === "offline" && errorMsg && (
                <p className="text-xs text-red-400 text-center max-w-[250px]"></p>
            )}
        </div>
    );
}
