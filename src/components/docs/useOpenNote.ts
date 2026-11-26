"use client";

import {useRouter} from "next/navigation";
import {useCreateNote, useNotes} from "@/hooks/useDocs";

/**
 * [[제목]] 클릭: 노트 목록(통합 뷰, 캐시 공유)에서 제목으로 찾아 이동하고, 없으면 그 제목으로 만든 뒤 이동한다 (Obsidian 동작).
 * vaultId 를 주면 그 vault 안에서만 찾고 그 vault 에 만든다(링크는 vault 안에서만 해석된다).
 * ponytail: 목록은 서버가 500건까지 준다. 넘으면 by-title API 로 바꿀 것.
 */
export function useOpenNote() {
    const router = useRouter();
    const notes = useNotes();
    const create = useCreateNote();
    return async (title: string, folderId: string | null = null, vaultId?: string) => {
        const hit = notes.data?.find((n) => n.title === title && (!vaultId || n.vaultId === vaultId));
        if (hit) return router.push(`/docs/${hit.id}`);
        const n = await create.mutateAsync({title, content: "", folderId, vaultId});
        router.push(`/docs/${n.id}?edit=1`);
    };
}
