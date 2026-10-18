"use client";

import {useEffect, useState} from "react";

type ToastType = "success" | "error";

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
}

export function Toast({message, type = "success", onClose}: ToastProps) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
                type === "error" ? "bg-red-500" : "bg-green-500"
            }`}
        >
            <span>{type === "error" ? "✕" : "✓"}</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
                ✕
            </button>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    const show = (message: string, type: ToastType = "success") =>
        setToast({message, type});
    const hide = () => setToast(null);

    const ToastComponent = toast ? (
        <Toast message={toast.message} type={toast.type} onClose={hide}/>
    ) : null;

    return {show, ToastComponent};
}
