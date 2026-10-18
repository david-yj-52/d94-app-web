"use client";

import {useState} from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        name: string;
        alias: string;
        url: string;
        note?: string;
    }) => void;
    platformName: string;
};

export default function ProductAddPopup({
                                            open,
                                            onClose,
                                            onSubmit,
                                            platformName,
                                        }: Props) {
    const [name, setName] = useState("");
    const [alias, setAlias] = useState("");
    const [url, setUrl] = useState("");
    const [note, setNote] = useState("");

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({name, alias, url, note});
        setName("");
        setAlias("");
        setUrl("");
        setNote("");
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
                <h2 className="mb-4 text-lg font-semibold">
                    {platformName
                        ? `[${platformName}] 제품 추가`
                        : "제품 추가"}
                </h2>

                <div className="space-y-3 text-sm">
                    <Field label="제품 이름">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-9 w-full rounded border border-gray-300 px-2"
                            required
                        />
                    </Field>
                    <Field label="제품 별명">
                        <input
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className="h-9 w-full rounded border border-gray-300 px-2"
                        />
                    </Field>
                    <Field label="제품 URL">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="h-9 w-full rounded border border-gray-300 px-2"
                            required
                        />
                    </Field>
                    <Field label="Note">
            <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-2 py-1"
            />
                    </Field>
                </div>

                <div className="mt-6 flex justify-end gap-2 text-sm">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded border border-gray-300 px-4 py-1 text-gray-700 hover:bg-gray-50"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="rounded bg-black px-4 py-1 font-medium text-white hover:bg-gray-900"
                    >
                        저장
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
                   label,
                   children,
               }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <div className="mb-1 text-xs font-medium text-gray-600">{label}</div>
            {children}
        </label>
    );
}

