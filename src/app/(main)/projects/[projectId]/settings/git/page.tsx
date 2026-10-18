"use client";

import {useToast} from "@/components/ui/Toast";
import {useDeleteGitRepo, useGitActivity, useGitRepos, useRegisterGitRepo,} from "@/hooks/useGitIntegration";
import type {GitRepoResponse} from "@/lib/api/git";
import {use, useState} from "react";

const PROVIDER_LABEL: Record<string, string> = {
    GITHUB: "GitHub",
    GITLAB: "GitLab",
    BITBUCKET: "Bitbucket",
};

const PROVIDER_COLOR: Record<string, string> = {
    GITHUB: "bg-slate-100 text-slate-700",
    GITLAB: "bg-orange-100 text-orange-700",
    BITBUCKET: "bg-blue-100 text-blue-700",
};

function CopyButton({text, label}: { text: string; label: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
            {copied ? "복사됨 ✓" : label}
        </button>
    );
}

interface WebhookModalProps {
    repo: GitRepoResponse;
    onClose: () => void;
}

function WebhookModal({repo, onClose}: WebhookModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Webhook 정보</h3>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
                    ⚠️ Webhook Secret은 지금만 확인할 수 있습니다. 반드시 안전한 곳에 저장해 두세요.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Webhook URL
                        </label>
                        <div
                            className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
                            <code className="flex-1 text-xs text-slate-700 break-all">
                                {repo.webhookUrl}
                            </code>
                            <CopyButton text={repo.webhookUrl} label="복사"/>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Webhook Secret
                        </label>
                        <div
                            className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
                            <code className="flex-1 text-xs text-slate-700 break-all font-mono">
                                {repo.webhookSecret}
                            </code>
                            <CopyButton text={repo.webhookSecret} label="복사"/>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        확인했습니다
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsGitPage({
                                            params,
                                        }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: repos, isLoading: reposLoading} = useGitRepos(projectId);
    const {data: activity, isLoading: activityLoading} = useGitActivity(projectId);
    const {mutate: registerRepo, isPending: isRegistering} = useRegisterGitRepo(projectId);
    const {mutate: deleteRepo} = useDeleteGitRepo(projectId);
    const {show, ToastComponent} = useToast();

    const [webhookModal, setWebhookModal] = useState<GitRepoResponse | null>(null);

    const [form, setForm] = useState({
        repoName: "",
        repoUrl: "",
        provider: "GITHUB" as "GITHUB" | "GITLAB" | "BITBUCKET",
        accessToken: "",
    });

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setForm((prev) => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.repoName.trim() || !form.repoUrl.trim() || !form.accessToken.trim()) return;
        registerRepo(form, {
            onSuccess: (data) => {
                setForm({repoName: "", repoUrl: "", provider: "GITHUB", accessToken: ""});
                setWebhookModal(data);
                show("저장소가 등록되었습니다.");
            },
            onError: () => show("저장소 등록에 실패했습니다.", "error"),
        });
    };

    const handleDelete = (repoId: string, repoName: string) => {
        if (!confirm(`"${repoName}" 저장소를 삭제하시겠습니까?`)) return;
        deleteRepo(repoId, {
            onSuccess: () => show("저장소가 삭제되었습니다."),
            onError: () => show("삭제에 실패했습니다.", "error"),
        });
    };

    return (
        <>
            {/* 헤더 */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Git 연동</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Git 저장소를 연결하고 커밋·PR 활동을 추적합니다.
                </p>
            </div>

            {/* 등록된 저장소 목록 */}
            <section className="mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">연결된 저장소</h3>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {reposLoading && (
                        <div className="py-8 text-center text-slate-400 text-sm">불러오는 중...</div>
                    )}
                    {!reposLoading && (!repos || repos.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-sm">
                            연결된 저장소가 없습니다.
                        </div>
                    )}
                    {repos?.map((repo) => (
                        <div key={repo.id} className="flex items-center justify-between px-4 py-3 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${PROVIDER_COLOR[repo.provider] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {PROVIDER_LABEL[repo.provider] ?? repo.provider}
                </span>
                                <span className="font-medium text-slate-800 text-sm truncate">
                  {repo.repoName}
                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <CopyButton text={repo.webhookUrl} label="Webhook URL 복사"/>
                                <CopyButton text={repo.webhookSecret} label="Secret 복사"/>
                                <button
                                    onClick={() => handleDelete(repo.id, repo.repoName)}
                                    className="text-xs text-red-400 hover:text-red-600 ml-1"
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 저장소 등록 폼 */}
            <section className="mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">저장소 등록</h3>
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-200 p-5 space-y-4 bg-slate-50"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                저장소 이름
                            </label>
                            <input
                                name="repoName"
                                value={form.repoName}
                                onChange={handleFormChange}
                                placeholder="my-awesome-repo"
                                required
                                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                제공자
                            </label>
                            <select
                                name="provider"
                                value={form.provider}
                                onChange={handleFormChange}
                                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="GITHUB">GitHub</option>
                                <option value="GITLAB">GitLab</option>
                                <option value="BITBUCKET">Bitbucket</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            저장소 URL
                        </label>
                        <input
                            name="repoUrl"
                            value={form.repoUrl}
                            onChange={handleFormChange}
                            placeholder="https://github.com/org/repo"
                            required
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Access Token
                        </label>
                        <input
                            name="accessToken"
                            type="password"
                            value={form.accessToken}
                            onChange={handleFormChange}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            required
                            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-400">
                            토큰은 암호화되어 저장되며 Webhook 인증에만 사용됩니다.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="h-9 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            {isRegistering ? "등록 중..." : "저장소 등록"}
                        </button>
                    </div>
                </form>
            </section>

            {/* 최근 Git 활동 */}
            <section>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">최근 Git 활동</h3>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {activityLoading && (
                        <div className="py-8 text-center text-slate-400 text-sm">불러오는 중...</div>
                    )}
                    {!activityLoading && (!activity || activity.length === 0) && (
                        <div className="py-8 text-center text-slate-400 text-sm">
                            최근 활동이 없습니다.
                        </div>
                    )}
                    {activity?.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span
                  className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.type === "PR"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
              >
                {item.type === "PR" ? "PR" : "커밋"}
              </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-slate-800 truncate">{item.message}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {item.author} ·{" "}
                                    {new Date(item.createdAt).toLocaleString("ko-KR", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            {item.url && (
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 text-xs text-blue-500 hover:underline"
                                >
                                    보기
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Webhook 정보 모달 */}
            {webhookModal && (
                <WebhookModal repo={webhookModal} onClose={() => setWebhookModal(null)}/>
            )}

            {ToastComponent}
        </>
    );
}
