// 노트 편집 초안을 브라우저 IndexedDB 에 보관한다 — 서버 저장이 실패하거나 서비스가 내려가도 작성 내용을 잃지 않게.
// ponytail: localStorage 금지 규칙(L1 §5) 때문에 IndexedDB. 사적 모드 등으로 열 수 없으면 조용히 건너뛴다(서버 자동 저장은 계속).

export interface NoteDraft {
    noteId: string;
    title: string;
    content: string;
    /** 초안을 만들 때 서버 버전 */
    baseVersion: number;
    savedAt: number;
}

const DB = "d94-docs";
const STORE = "drafts";

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, {keyPath: "noteId"});
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
    try {
        const db = await open();
        return await new Promise<T>((resolve, reject) => {
            const req = fn(db.transaction(STORE, mode).objectStore(STORE));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch {
        return undefined;
    }
}

export const loadDraft = (noteId: string) => run<NoteDraft>("readonly", (s) => s.get(noteId));
export const saveDraft = (d: NoteDraft) => run("readwrite", (s) => s.put(d)).then(() => undefined);
export const deleteDraft = (noteId: string) => run("readwrite", (s) => s.delete(noteId)).then(() => undefined);
