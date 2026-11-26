type Row = { id: string; name: string; alias: string; url: string; note?: string };

/** PlatformTable·ProductTable 의 모바일(< md) 카드 목록. 데스크톱은 각 테이블이 그린다. */
export default function MobileRowCards({rows, selectedId, onSelect, emptyText}: {
    rows: Row[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    emptyText: string;
}) {
    if (rows.length === 0) {
        return <p className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-400 md:hidden">{emptyText}</p>;
    }
    return (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 md:hidden">
            {rows.map((r) => (
                <li key={r.id}>
                    <button type="button" onClick={() => onSelect(r.id)}
                            className={`block w-full px-3 py-3 text-left text-sm active:bg-gray-50 ${r.id === selectedId ? "bg-d94-brand-soft" : ""}`}>
                        <span className="flex items-baseline gap-2">
                            <span className="font-medium text-gray-900">{r.name}</span>
                            {r.alias && <span className="text-xs text-gray-500">{r.alias}</span>}
                        </span>
                        {r.url && <span className="mt-1 block break-all text-xs text-d94-brand underline">{r.url}</span>}
                        {r.note && <span className="mt-1 block text-xs text-gray-600">{r.note}</span>}
                    </button>
                </li>
            ))}
        </ul>
    );
}
