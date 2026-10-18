"use client";

import {useToast} from "@/components/ui/Toast";
import {
    useAddReaction,
    useComments,
    useCreateComment,
    useDeleteComment,
    useRemoveReaction,
    useUpdateComment,
} from "@/hooks/useComments";
import {searchUsers} from "@/lib/api/users";
import type {CommentResponse} from "@/types/comment";
import type {UserSummary} from "@/types/issue";
import {useEffect, useRef, useState} from "react";
import ReactMarkdown from "react-markdown";

const EMOJI_LIST = ["👍", "👎", "❤️", "😄", "😮", "🎉"];

// ─── @멘션 지원 텍스트에리어 ─────────────────────────────────────────────────

interface MentionState {
    active: boolean;
    keyword: string;
    startIndex: number;
    results: UserSummary[];
}

function useMention(
    value: string,
    setValue: (v: string) => void,
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
) {
    const [mention, setMention] = useState<MentionState>({
        active: false,
        keyword: "",
        startIndex: -1,
        results: [],
    });

    const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape") {
            setMention((m) => ({...m, active: false}));
            return;
        }
        const el = textareaRef.current;
        if (!el) return;
        const cursor = el.selectionStart;
        const before = value.slice(0, cursor);
        const atIdx = before.lastIndexOf("@");
        if (atIdx === -1) {
            setMention((m) => ({...m, active: false}));
            return;
        }
        const between = before.slice(atIdx + 1);
        if (/\s/.test(between)) {
            setMention((m) => ({...m, active: false}));
            return;
        }
        const kw = between;
        setMention((m) => ({...m, active: true, keyword: kw, startIndex: atIdx}));
    };

    useEffect(() => {
        if (!mention.active) return;
        let cancelled = false;
        searchUsers(mention.keyword)
            .then((res) => {
                if (!cancelled) setMention((m) => ({...m, results: res}));
            })
            .catch(() => {
            });
        return () => {
            cancelled = true;
        };
    }, [mention.active, mention.keyword]);

    const selectMention = (user: UserSummary) => {
        const el = textareaRef.current;
        if (!el) return;
        const cursor = el.selectionStart;
        const before = value.slice(0, mention.startIndex);
        const after = value.slice(cursor);
        const inserted = `@${user.name} `;
        setValue(before + inserted + after);
        setMention((m) => ({...m, active: false}));
        setTimeout(() => {
            const pos = before.length + inserted.length;
            el.setSelectionRange(pos, pos);
            el.focus();
        }, 0);
    };

    const closeMention = () => setMention((m) => ({...m, active: false}));

    return {mention, handleKeyUp, selectMention, closeMention};
}

// ─── 댓글 입력창 (멘션 지원) ─────────────────────────────────────────────────

interface CommentInputProps {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
    placeholder?: string;
    submitLabel?: string;
    autoFocus?: boolean;
}

function CommentInput({
                          value,
                          onChange,
                          onSubmit,
                          onCancel,
                          isSubmitting,
                          placeholder = "댓글을 입력하세요... (Ctrl+Enter로 등록)",
                          submitLabel = "등록",
                          autoFocus = false,
                      }: CommentInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {mention, handleKeyUp, selectMention, closeMention} = useMention(
        value,
        onChange,
        textareaRef,
    );

    useEffect(() => {
        if (autoFocus) textareaRef.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
        if (!mention.active) return;
        const handler = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                textareaRef.current !== e.target
            ) {
                closeMention();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mention.active, closeMention]);

    return (
        <div className="relative">
      <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={handleKeyUp}
          onKeyDown={(e) => {
              if (e.key === "Escape") {
                  closeMention();
                  onCancel();
              }
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit();
          }}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
      />

            {mention.active && mention.results.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-20 left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                >
                    {mention.results.slice(0, 6).map((user) => (
                        <button
                            key={user.email}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectMention(user);
                            }}
                            className="w-full flex flex-col px-3 py-2 text-left hover:bg-slate-50 text-sm"
                        >
                            <span className="font-medium text-slate-800">{user.name}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex justify-end gap-2 mt-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                >
                    취소
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting || !value.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? "등록 중..." : submitLabel}
                </button>
            </div>
        </div>
    );
}

// ─── 이모지 피커 ─────────────────────────────────────────────────────────────

function EmojiPicker({
                         onSelect,
                         onClose,
                     }: {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute z-20 bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1"
        >
            {EMOJI_LIST.map((emoji) => (
                <button
                    key={emoji}
                    onClick={() => {
                        onSelect(emoji);
                        onClose();
                    }}
                    className="text-lg hover:bg-slate-100 rounded-lg p-1 transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}

// ─── 댓글 아이템 ─────────────────────────────────────────────────────────────

function CommentItem({
                         comment,
                         issueId,
                         depth = 0,
                     }: {
    comment: CommentResponse;
    issueId: string;
    depth?: number;
}) {
    const {show, ToastComponent} = useToast();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(comment.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const {mutate: updateComment, isPending: isUpdating} =
        useUpdateComment(issueId);
    const {mutate: deleteComment, isPending: isDeleting} =
        useDeleteComment(issueId);
    const {mutate: createComment, isPending: isReplying} =
        useCreateComment(issueId);
    const {mutate: addReaction} = useAddReaction(issueId);
    const {mutate: removeReaction} = useRemoveReaction(issueId);

    const handleSave = () => {
        const trimmed = draft.trim();
        if (!trimmed || trimmed === comment.content) {
            setEditing(false);
            return;
        }
        updateComment(
            {commentId: comment.id, data: {content: trimmed}},
            {
                onSuccess: () => {
                    setEditing(false);
                    show("댓글이 수정되었습니다.");
                },
                onError: () => show("댓글 수정에 실패했습니다.", "error"),
            },
        );
    };

    const handleDelete = () => {
        deleteComment(comment.id, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                show("댓글이 삭제되었습니다.");
            },
            onError: () => show("댓글 삭제에 실패했습니다.", "error"),
        });
    };

    const handleReplySubmit = () => {
        const trimmed = replyContent.trim();
        if (!trimmed) return;
        createComment(
            {content: trimmed, parentCommentId: comment.id},
            {
                onSuccess: () => {
                    setReplyContent("");
                    setShowReplyForm(false);
                    show("답글이 등록되었습니다.");
                },
                onError: () => show("답글 등록에 실패했습니다.", "error"),
            },
        );
    };

    const handleReaction = (emoji: string) => {
        const existing = comment.reactions?.find((r) => r.emoji === emoji);
        if (existing?.reacted) {
            removeReaction(
                {commentId: comment.id, emoji},
                {onError: () => show("반응 취소에 실패했습니다.", "error")},
            );
        } else {
            addReaction(
                {commentId: comment.id, emoji},
                {onError: () => show("반응 추가에 실패했습니다.", "error")},
            );
        }
    };

    return (
        <div className={depth > 0 ? "ml-10 pl-4 border-l-2 border-slate-100" : ""}>
            <div className="group flex gap-3">
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 uppercase">
                    {comment.author.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800">
              {comment.author.name}
            </span>
                        <span className="text-xs text-slate-400">
              {new Date(comment.createdAt).toLocaleString("ko-KR")}
            </span>
                        {comment.createdAt !== comment.modifiedAt && (
                            <span className="text-xs text-slate-400 italic">(수정됨)</span>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-2">
              <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === "Escape") {
                          setDraft(comment.content);
                          setEditing(false);
                      }
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                          handleSave();
                  }}
                  rows={3}
                  autoFocus
                  className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isUpdating || !draft.trim()}
                                    className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isUpdating ? "저장 중..." : "저장"}
                                </button>
                                <button
                                    onClick={() => {
                                        setDraft(comment.content);
                                        setEditing(false);
                                    }}
                                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="prose prose-sm max-w-none text-slate-700 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{comment.content}</ReactMarkdown>
                        </div>
                    )}

                    {/* 이모지 반응 */}
                    {!editing && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 relative">
                            {comment.reactions
                                ?.filter((r) => r.count > 0)
                                .map((r) => (
                                    <button
                                        key={r.emoji}
                                        onClick={() => handleReaction(r.emoji)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-colors ${
                                            r.reacted
                                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{r.emoji}</span>
                                        <span>{r.count}</span>
                                    </button>
                                ))}

                            <div className="relative">
                                <button
                                    onClick={() => setShowEmojiPicker((v) => !v)}
                                    className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 text-xs"
                                >
                                    +
                                </button>
                                {showEmojiPicker && (
                                    <EmojiPicker
                                        onSelect={handleReaction}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                )}
                            </div>

                            {depth === 0 && (
                                <button
                                    onClick={() => setShowReplyForm((v) => !v)}
                                    className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                                >
                                    답글
                                </button>
                            )}
                        </div>
                    )}

                    {/* 답글 입력 폼 */}
                    {showReplyForm && (
                        <div className="mt-3">
                            <CommentInput
                                value={replyContent}
                                onChange={setReplyContent}
                                onSubmit={handleReplySubmit}
                                onCancel={() => {
                                    setShowReplyForm(false);
                                    setReplyContent("");
                                }}
                                isSubmitting={isReplying}
                                placeholder="답글을 입력하세요... (Ctrl+Enter로 등록)"
                                submitLabel="답글 등록"
                                autoFocus
                            />
                        </div>
                    )}
                </div>

                {!editing && (
                    <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                setDraft(comment.content);
                                setEditing(true);
                            }}
                            className="px-2 py-1 rounded text-xs text-slate-500 hover:bg-slate-100"
                        >
                            수정
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-50"
                        >
                            삭제
                        </button>
                    </div>
                )}
            </div>

            {/* 대댓글 목록 */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            issueId={issueId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40"/>
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            댓글 삭제
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            이 댓글을 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 h-9 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                            >
                                {isDeleting ? "삭제 중..." : "삭제"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ToastComponent}
        </div>
    );
}

// ─── 댓글 섹션 ───────────────────────────────────────────────────────────────

export function CommentSection({issueId}: { issueId: string }) {
    const {show, ToastComponent} = useToast();
    const {data: comments, isLoading} = useComments(issueId);
    const {mutate: createComment, isPending: isSubmitting} =
        useCreateComment(issueId);

    const [newContent, setNewContent] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = () => {
        const trimmed = newContent.trim();
        if (!trimmed) return;
        createComment(
            {content: trimmed},
            {
                onSuccess: () => {
                    setNewContent("");
                    setIsFocused(false);
                    show("댓글이 등록되었습니다.");
                },
                onError: () => show("댓글 등록에 실패했습니다.", "error"),
            },
        );
    };

    return (
        <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 px-1">
                댓글{" "}
                {comments && comments.length > 0 && (
                    <span className="ml-1 text-slate-400 font-normal">
            ({comments.length})
          </span>
                )}
            </h2>

            {/* 댓글 작성 폼 */}
            <div className="mb-6">
                {isFocused ? (
                    <CommentInput
                        value={newContent}
                        onChange={setNewContent}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setIsFocused(false);
                            setNewContent("");
                        }}
                        isSubmitting={isSubmitting}
                        autoFocus
                    />
                ) : (
                    <div
                        onClick={() => setIsFocused(true)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 cursor-text hover:border-slate-300 transition-colors"
                    >
                        댓글을 입력하세요...
                    </div>
                )}
            </div>

            {/* 댓글 목록 */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200"/>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-200 rounded w-24"/>
                                <div className="h-4 bg-slate-200 rounded w-full"/>
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments && comments.length > 0 ? (
                <div className="space-y-5">
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} issueId={issueId}/>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-400 text-center py-6">
                    아직 댓글이 없습니다.
                </p>
            )}

            {ToastComponent}
        </div>
    );
}
