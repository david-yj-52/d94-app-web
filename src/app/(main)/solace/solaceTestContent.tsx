"use client";

import {useEffect, useRef, useState} from "react";
import {useSolace} from "@/lib/messaging/solace/useSolace";

export default function SolaceTestContent() {
    const {
        isConnected,
        isConnecting,
        messages,
        error,
        connect,
        publish,
        disconnect,
        clearMessages,
    } = useSolace();

    const [inputMessage, setInputMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const handleSend = async () => {
        if (!inputMessage.trim() || isSending) return;
        try {
            setIsSending(true);
            await publish(inputMessage);
        } catch (e) {
            console.error("요청 실패:", e);
        } finally {
            setIsSending(false);
            setInputMessage("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-2.5 h-2.5 rounded-full ${
                            isConnected
                                ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                                : isConnecting
                                    ? "bg-yellow-400 animate-pulse"
                                    : "bg-gray-600"
                        }`}
                    />
                    <h1 className="text-lg font-semibold tracking-tight">
                        Solace Message Test
                    </h1>
                    <span className="text-xs text-gray-500">
            {isConnected
                ? "Connected"
                : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
          </span>
                </div>

                <div className="flex items-center gap-2">
                    {!isConnected ? (
                        <button
                            onClick={connect}
                            disabled={isConnecting}
                            className="px-4 py-1.5 text-sm bg-emerald-500 hover:bg-emerald-400
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       rounded-md font-medium transition-colors"
                        >
                            {isConnecting ? "연결 중..." : "연결"}
                        </button>
                    ) : (
                        <button
                            onClick={disconnect}
                            className="px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600
                                       rounded-md font-medium transition-colors"
                        >
                            연결 해제
                        </button>
                    )}
                    <button
                        onClick={clearMessages}
                        className="px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700
                                   rounded-md font-medium transition-colors"
                    >
                        초기화
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div
                    className="mx-6 mt-4 px-4 py-3 bg-red-900/40 border border-red-700
                                rounded-lg text-red-300 text-sm"
                >
                    {error}
                </div>
            )}

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                        메시지가 없습니다. 연결 후 메시지를 발송해보세요.
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.direction === "sent" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-xl px-4 py-3 space-y-1.5 ${
                                msg.direction === "sent"
                                    ? "bg-emerald-900/60 border border-emerald-700/50"
                                    : "bg-gray-800 border border-gray-700"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                <span
                    className={`text-xs font-mono ${
                        msg.direction === "sent"
                            ? "text-emerald-400"
                            : "text-blue-400"
                    }`}
                >
                  {msg.direction === "sent" ? "▲ SENT" : "▼ RECEIVED"}
                </span>
                                <span className="text-xs text-gray-500 font-mono truncate">
                  {msg.topic}
                </span>
                            </div>

                            <p className="text-sm text-gray-100 break-all whitespace-pre-wrap">
                                {msg.payload}
                            </p>

                            {msg.selectorKey && (
                                <p className="text-xs text-gray-600 font-mono">
                                    key: {msg.selectorKey.slice(0, 8)}...
                                </p>
                            )}

                            <p className="text-xs text-gray-500">
                                {msg.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>

            {/* Input */}
            <div className="border-t border-gray-800 px-6 py-4">
                <div className="flex gap-3">
          <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || isSending}
              placeholder={
                  !isConnected
                      ? "연결 후 입력 가능합니다"
                      : isSending
                          ? "응답 대기 중..."
                          : "메시지 입력 (Enter 발송, Shift+Enter 줄바꿈)"
              }
              rows={2}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3
                                   text-sm text-gray-100 placeholder-gray-500 resize-none
                                   focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />
                    <button
                        onClick={handleSend}
                        disabled={!isConnected || !inputMessage.trim() || isSending}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   rounded-xl font-medium text-sm transition-colors self-end"
                    >
                        {isSending ? "대기 중..." : "발송"}
                    </button>
                </div>

                <div className="mt-2 flex gap-4 text-xs text-gray-600">
          <span>
            발송: {messages.filter((m) => m.direction === "sent").length}건
          </span>
                    <span>
            수신: {messages.filter((m) => m.direction === "received").length}건
          </span>
                    <span>대기: {isSending ? "1건" : "없음"}</span>
                </div>
            </div>
        </div>
    );
}
