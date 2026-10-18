"use client";

import {useCqlAutocomplete, useCqlValidate} from "@/hooks/useCqlSearch";
import {Play} from "lucide-react";
import {KeyboardEvent, useCallback, useEffect, useRef, useState,} from "react";

interface CqlEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
    placeholder?: string;
}

// CQL 문법 하이라이팅 (HTML로 렌더링)
function highlightCql(text: string): string {
    if (!text) return "";

    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 키워드 (파란색)
    const withKeywords = escaped.replace(
        /\b(AND|OR|NOT|IN|ORDER BY|ASC|DESC|BY)\b/g,
        '<span class="cql-keyword">$1</span>',
    );

    // 함수 (초록색)
    const withFunctions = withKeywords.replace(
        /\b(currentUser|openSprints|closedSprints|futureSprints)\s*\(\s*\)/g,
        '<span class="cql-function">$&</span>',
    );

    // 필드명 (보라색)
    const withFields = withFunctions.replace(
        /\b(project|status|assignee|priority|sprint|type|created|updated|reporter|resolution|component|version|fixVersion|labels|summary|description|comment|issueKey|id|storyPnt|dueDt)\b(?=\s*[=!<>]|\s+in\b|\s+not\b)/gi,
        '<span class="cql-field">$&</span>',
    );

    // 문자열 값 (주황색)
    const withStrings = withFields.replace(
        /"([^"]*)"/g,
        '<span class="cql-string">&quot;$1&quot;</span>',
    );

    return withStrings;
}

export default function CqlEditor({
                                      value,
                                      onChange,
                                      onSearch,
                                      placeholder = 'project = "PROJ-A" AND status = "In Progress"',
                                  }: CqlEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPos, setCursorPos] = useState(0);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(0);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const {data: validateResult} = useCqlValidate(value);
    const {data: autocompleteResult} = useCqlAutocomplete(
        value,
        cursorPos,
    );

    const suggestions = autocompleteResult?.suggestions ?? [];
    const isValid = !value.trim() || validateResult?.valid !== false;
    const validationError = validateResult?.valid === false ? validateResult.error : null;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (showAutocomplete && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedSuggestion((prev) =>
                        Math.min(prev + 1, suggestions.length - 1),
                    );
                    return;
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedSuggestion((prev) => Math.max(prev - 1, 0));
                    return;
                }
                if (e.key === "Tab" || (e.key === "Enter" && showAutocomplete)) {
                    e.preventDefault();
                    applySuggestion(suggestions[selectedSuggestion]);
                    return;
                }
                if (e.key === "Escape") {
                    setShowAutocomplete(false);
                    return;
                }
            }

            if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                onSearch();
            }
        },
        [showAutocomplete, suggestions, selectedSuggestion, onSearch],
    );

    function applySuggestion(suggestion: string) {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart ?? cursorPos;
        // Find the start of current word/token
        const before = value.slice(0, start);
        const wordStart = before.search(/[\w"'(]*$/);
        const after = value.slice(start);
        const newValue = value.slice(0, wordStart) + suggestion + after;
        onChange(newValue);
        setShowAutocomplete(false);
        // Set cursor after inserted text
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursor = wordStart + suggestion.length;
                textareaRef.current.setSelectionRange(newCursor, newCursor);
                textareaRef.current.focus();
            }
        }, 0);
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        onChange(e.target.value);
        const pos = e.target.selectionStart ?? 0;
        setCursorPos(pos);
        setShowAutocomplete(true);
        setSelectedSuggestion(0);
    }

    function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
        const target = e.target as HTMLTextAreaElement;
        setCursorPos(target.selectionStart ?? 0);
    }

    // Close autocomplete on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                autocompleteRef.current &&
                !autocompleteRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                setShowAutocomplete(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const showDropdown =
        showAutocomplete && suggestions.length > 0 && !!value.trim();

    return (
        <div className="cql-editor-wrapper">
            <style>{`
        .cql-keyword { color: #2563eb; font-weight: 600; }
        .cql-field   { color: #7c3aed; }
        .cql-function { color: #059669; }
        .cql-string  { color: #d97706; }
        .cql-highlight-layer {
          position: absolute; inset: 0;
          padding: 10px 14px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-all;
          pointer-events: none;
          color: transparent;
          overflow: hidden;
        }
      `}</style>

            <div className="relative">
                {/* Syntax-highlighted backdrop */}
                <div
                    className="cql-highlight-layer"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{__html: highlightCql(value) || ""}}
                />

                {/* Actual textarea (transparent text, caret visible) */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder={placeholder}
                    rows={3}
                    spellCheck={false}
                    className={`relative w-full resize-none rounded-t-xl border bg-white px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-gray-900 focus:outline-none focus:ring-2 transition-colors ${
                        !isValid && value.trim()
                            ? "border-red-300 focus:ring-red-400"
                            : "border-gray-200 focus:ring-blue-500"
                    }`}
                    style={{
                        fontFamily:
                            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    }}
                />

                {/* Autocomplete dropdown */}
                {showDropdown && (
                    <div
                        ref={autocompleteRef}
                        className="absolute left-0 top-full z-50 mt-0.5 max-h-48 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
                    >
                        {suggestions.map((s, i) => (
                            <button
                                key={s}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    applySuggestion(s);
                                }}
                                className={`block w-full px-3 py-2 text-left font-mono text-xs hover:bg-blue-50 ${
                                    i === selectedSuggestion ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div
                className={`flex items-center justify-between rounded-b-xl border-x border-b px-3.5 py-2 text-xs ${
                    !isValid && value.trim()
                        ? "border-red-300 bg-red-50 text-red-600"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                }`}
            >
        <span>
          {!isValid && validationError ? (
              <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500"/>
                  {validationError}
            </span>
          ) : value.trim() && validateResult?.valid ? (
              <span className="flex items-center gap-1.5 text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"/>
              유효한 CQL
            </span>
          ) : (
              "CQL 문법으로 이슈를 검색하세요"
          )}
        </span>
                <span className="text-gray-300">Ctrl+Enter로 검색</span>
            </div>

            {/* Run button */}
            <button
                type="button"
                onClick={onSearch}
                disabled={!value.trim() || (!isValid && !!validateResult)}
                className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
                <Play className="h-3.5 w-3.5"/>
                검색 실행
            </button>
        </div>
    );
}
