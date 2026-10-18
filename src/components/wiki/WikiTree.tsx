"use client";

import type {WikiPageSummary} from "@/lib/api/wiki";
import {ChevronDown, ChevronRight, FilePlus, MoreHorizontal, Plus, Trash2} from "lucide-react";
import {useEffect, useRef, useState} from "react";

interface WikiTreeNode extends WikiPageSummary {
    children: WikiTreeNode[];
}

function buildTree(pages: WikiPageSummary[]): WikiTreeNode[] {
    const map = new Map<string, WikiTreeNode>();
    const roots: WikiTreeNode[] = [];

    pages.forEach((p) => map.set(p.id, {...p, children: []}));

    pages.forEach((p) => {
        const node = map.get(p.id)!;
        if (p.parentId && map.has(p.parentId)) {
            map.get(p.parentId)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    const sort = (nodes: WikiTreeNode[]) => {
        nodes.sort((a, b) => a.sortOrder - b.sortOrder);
        nodes.forEach((n) => sort(n.children));
    };
    sort(roots);
    return roots;
}

interface TreeNodeProps {
    node: WikiTreeNode;
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAddChild: (parentId: string) => void;
    onDelete: (id: string, title: string) => void;
    depth?: number;
}

function TreeNode({node, selectedId, onSelect, onAddChild, onDelete, depth = 0}: TreeNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isSelected = node.id === selectedId;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }

        if (menuOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    return (
        <div>
            <div
                className={[
                    "group flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer text-sm select-none",
                    isSelected
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-slate-600 hover:bg-slate-100",
                ].join(" ")}
                style={{paddingLeft: `${8 + depth * 16}px`}}
                onClick={() => onSelect(node.id)}
            >
                {/* expand toggle */}
                <button
                    className="shrink-0 text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((v) => !v);
                    }}
                >
                    {node.children.length > 0 ? (
                        expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>
                    ) : (
                        <span className="w-3"/>
                    )}
                </button>

                <span className="flex-1 truncate">{node.title}</span>

                {/* hover actions */}
                <span className="hidden group-hover:flex items-center gap-0.5">
          <button
              title="하위 페이지 추가"
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
              }}
          >
            <Plus size={12}/>
          </button>
          <div className="relative" ref={menuRef}>
            <button
                title="더보기"
                className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                }}
            >
              <MoreHorizontal size={12}/>
            </button>
              {menuOpen && (
                  <div
                      className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-32">
                      <button
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(false);
                              onDelete(node.id, node.title);
                          }}
                      >
                          <Trash2 size={13}/>
                          삭제
                      </button>
                  </div>
              )}
          </div>
        </span>
            </div>

            {expanded && node.children.length > 0 && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface WikiTreeProps {
    pages: WikiPageSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAddPage: (parentId?: string) => void;
    onDeletePage: (id: string, title: string) => void;
}

export default function WikiTree({
                                     pages,
                                     selectedId,
                                     onSelect,
                                     onAddPage,
                                     onDeletePage,
                                 }: WikiTreeProps) {
    const tree = buildTree(pages);

    return (
        <div className="w-60 shrink-0 border-r border-slate-200 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wiki</span>
                <button
                    title="새 페이지"
                    onClick={() => onAddPage()}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                    <FilePlus size={15}/>
                </button>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto py-2 px-1">
                {tree.length === 0 && (
                    <div className="text-xs text-slate-400 px-3 py-2">페이지가 없습니다.</div>
                )}
                {tree.map((node) => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onAddChild={(parentId) => onAddPage(parentId)}
                        onDelete={onDeletePage}
                    />
                ))}
            </div>
        </div>
    );
}
