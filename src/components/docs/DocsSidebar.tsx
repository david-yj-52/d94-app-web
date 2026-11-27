"use client";

import {useState} from "react";
import Link from "next/link";
import {ChevronDown, ChevronRight, FileText, Folder, FolderPlus, Lock, MoreHorizontal, Plus, Users} from "lucide-react";
import type {DocsFolder, DocsVault, NoteSummary} from "@/types/docs";
import EmptyState from "@/components/ui/EmptyState";
import DropdownMenu from "@/components/ui/DropdownMenu";
import Button from "@/components/ui/Button";

interface DocsSidebarProps {
    /** 보여 줄 vault 들 (통합 뷰면 여러 개). vault 마다 섹션 하나 */
    vaults: DocsVault[];
    folders: DocsFolder[];
    notes: NoteSummary[];
    selectedNoteId: string | null;
    onNewNote: (folderId: string | null, vaultId: string) => void;
    onNewFolder: (parentId: string | null, vaultId: string) => void;
    onRenameFolder: (folder: DocsFolder) => void;
    onDeleteFolder: (folder: DocsFolder) => void;
    onMoveFolder: (folder: DocsFolder) => void;
    /** 끌어 놓기: 노트·폴더를 같은 vault 의 폴더(최상위면 null)로 옮김. 자기 하위·다른 vault 는 놓을 수 없음 */
    onDropItem: (item: DragItem, folderId: string | null) => void;
}

export interface DragItem {
    kind: "note" | "folder";
    id: string;
    vaultId: string;
    /** 지금 들어 있는 폴더 (같은 곳에 놓기 방지) */
    parentId: string | null;
}

/** HTML5 DnD (CIRA 칸반과 같은 방식). 터치 기기는 ··· 메뉴의 "이동"을 씀 */
interface Dnd {
    start: (item: DragItem) => (e: React.DragEvent) => void;
    end: () => void;
    target: (key: string, folderId: string | null, vaultId: string) => {
        onDragOver: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
    over: string | null;
}

const DROP_HL = "bg-d94-brand-soft ring-1 ring-inset ring-d94-brand";

/** vault 섹션(🔒 Private / 👥 Team) 안에 폴더 트리 + 폴더별 노트. 폴더는 parentId 로 트리를 만든다. 접힘 상태는 로컬. */
export default function DocsSidebar(props: DocsSidebarProps) {
    const {vaults, folders, notes, onNewNote, onNewFolder} = props;
    const [closed, setClosed] = useState<Set<string>>(new Set());
    const toggle = (id: string) => setClosed((s) => {
        const n = new Set(s);
        if (n.has(id)) n.delete(id); else n.add(id);
        return n;
    });
    const [drag, setDrag] = useState<DragItem | null>(null);
    const [over, setOver] = useState<string | null>(null);
    const parentOf = new Map(folders.map((f) => [f.id, f.parentId]));
    const inside = (id: string | null, ancestor: string) => {
        for (let i = 0; id && i < 100; i++, id = parentOf.get(id) ?? null) if (id === ancestor) return true;
        return false;
    };
    const canDrop = (folderId: string | null, vaultId: string) => !!drag && drag.vaultId === vaultId && drag.parentId !== folderId
        && !(drag.kind === "folder" && inside(folderId, drag.id));
    const dnd: Dnd = {
        over,
        start: (item) => (e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item.id); // Firefox 는 데이터가 있어야 끌기 시작
            setDrag(item);
        },
        end: () => {
            setDrag(null);
            setOver(null);
        },
        target: (key, folderId, vaultId) => ({
            onDragOver: (e) => {
                if (!canDrop(folderId, vaultId)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOver(key);
            },
            onDragLeave: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver((o) => (o === key ? null : o));
            },
            onDrop: (e) => {
                e.preventDefault();
                if (drag && canDrop(folderId, vaultId)) props.onDropItem(drag, folderId);
                dnd.end();
            },
        }),
    };
    return (
        <nav aria-label="노트 탐색" className="space-y-3 text-sm">
            {vaults.map((v) => {
                const vf = folders.filter((f) => f.vaultId === v.id);
                const vn = notes.filter((n) => n.vaultId === v.id);
                const key = `vault:${v.id}`;
                const Icon = v.type === "PRIVATE" ? Lock : Users;
                return (
                    <section key={v.id} aria-label={v.name}>
                        <div {...dnd.target(key, null, v.id)} className={`mb-1 flex items-center gap-1 rounded ${dnd.over === key ? DROP_HL : ""}`}>
                            <Button variant="unstyled" type="button" onClick={() => toggle(key)}
                                    className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium text-slate-600">
                                {closed.has(key) ? <ChevronRight className="h-3 w-3 shrink-0"/> : <ChevronDown className="h-3 w-3 shrink-0"/>}
                                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400"/>
                                <span className="truncate">{v.name}</span>
                            </Button>
                            <Button variant="unstyled" type="button" onClick={() => onNewNote(null, v.id)} aria-label={`${v.name} 새 노트`} title="새 노트"
                                    className="rounded p-1 text-slate-500 hover:bg-slate-100"><Plus className="h-4 w-4"/></Button>
                            <Button variant="unstyled" type="button" onClick={() => onNewFolder(null, v.id)} aria-label={`${v.name} 새 폴더`} title="새 폴더"
                                    className="rounded p-1 text-slate-500 hover:bg-slate-100"><FolderPlus className="h-4 w-4"/></Button>
                        </div>
                        {!closed.has(key) && <Tree {...props} folders={vf} notes={vn} parentId={null} depth={0} closed={closed} toggle={toggle} dnd={dnd}/>}
                        {!closed.has(key) && vf.length === 0 && vn.length === 0 &&
                            <EmptyState size="sm" className="px-2 py-2 text-left">아직 노트가 없습니다.</EmptyState>}
                    </section>
                );
            })}
        </nav>
    );
}

function Tree(p: DocsSidebarProps & { parentId: string | null; depth: number; closed: Set<string>; toggle: (id: string) => void; dnd: Dnd }) {
    const subFolders = p.folders.filter((f) => f.parentId === p.parentId);
    const here = p.notes.filter((n) => n.folderId === p.parentId).sort((a, b) => a.title.localeCompare(b.title));
    // 들여쓰기 깊이는 동적 수치라 Tailwind 클래스로 표현할 수 없어 인라인 style 사용
    const indent = {paddingLeft: `${p.depth * 12 + 4}px`};
    return (
        <ul>
            {subFolders.map((f) => (
                <li key={f.id}>
                    <div draggable onDragStart={p.dnd.start({kind: "folder", id: f.id, vaultId: f.vaultId, parentId: f.parentId})} onDragEnd={p.dnd.end}
                         {...p.dnd.target(f.id, f.id, f.vaultId)}
                         className={`group flex items-center gap-1 rounded py-1 pr-1 ${p.dnd.over === f.id ? DROP_HL : "hover:bg-slate-100"}`} style={indent}>
                        <Button variant="unstyled" type="button" onClick={() => p.toggle(f.id)} className="flex min-w-0 flex-1 items-center gap-1 text-left text-slate-700">
                            {p.closed.has(f.id) ? <ChevronRight className="h-3 w-3 shrink-0"/> : <ChevronDown className="h-3 w-3 shrink-0"/>}
                            <Folder className="h-4 w-4 shrink-0 text-slate-400"/>
                            <span className="truncate">{f.name}</span>
                        </Button>
                        <FolderMenu folder={f} {...p}/>
                    </div>
                    {!p.closed.has(f.id) && <Tree {...p} parentId={f.id} depth={p.depth + 1}/>}
                </li>
            ))}
            {here.map((n) => (
                <li key={n.id}>
                    <Link href={`/docs/${n.id}`} style={indent} draggable
                          onDragStart={p.dnd.start({kind: "note", id: n.id, vaultId: n.vaultId, parentId: n.folderId})} onDragEnd={p.dnd.end}
                          className={`flex items-center gap-1 rounded py-1 pr-1 ${n.id === p.selectedNoteId ? "bg-d94-brand-soft text-d94-brand" : "text-slate-700 hover:bg-slate-100"}`}>
                        <FileText className="ml-4 h-4 w-4 shrink-0 text-slate-400"/>
                        <span className="truncate">{n.title}</span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function FolderMenu(p: DocsSidebarProps & { folder: DocsFolder }) {
    const f = p.folder;
    return (
        <DropdownMenu
            trigger={
                // 터치 기기(< md)는 hover 가 없어 항상 보이게
                <Button variant="unstyled" type="button" aria-label={`${f.name} 메뉴`}
                        className="rounded p-0.5 text-slate-400 hover:bg-slate-200 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4"/>
                </Button>
            }
            items={[
                {label: "새 노트", onSelect: () => p.onNewNote(f.id, f.vaultId)},
                {label: "하위 폴더", onSelect: () => p.onNewFolder(f.id, f.vaultId)},
                {label: "이름 변경", onSelect: () => p.onRenameFolder(f)},
                {label: "이동", onSelect: () => p.onMoveFolder(f)},
                {label: "삭제", onSelect: () => p.onDeleteFolder(f), danger: true},
            ]}
        />
    );
}
