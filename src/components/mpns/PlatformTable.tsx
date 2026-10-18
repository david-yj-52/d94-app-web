export type Platform = {
    id: string;
    name: string;
    alias: string;
    url: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    platforms: Platform[];
    selectedPlatformId: string | null;
    onSelectPlatform: (id: string) => void;
    searchValue: string;
    onChangeSearch: (value: string) => void;
    onClickAdd: () => void;
};

export default function PlatformTable({
                                          platforms,
                                          selectedPlatformId,
                                          onSelectPlatform,
                                          searchValue,
                                          onChangeSearch,
                                          onClickAdd,
                                      }: Props) {
    return (
        <section className="flex-1 rounded-2xl bg-white p-4 shadow-md min-h-[460px]">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">플랫폼 설정</h2>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onChangeSearch(e.target.value)}
                        className="h-8 w-32 rounded border border-gray-300 px-2 text-sm"
                    />
                    <button
                        type="button"
                        className="h-8 rounded bg-black px-3 text-xs font-medium text-white"
                    >
                        검색
                    </button>
                    <button
                        type="button"
                        onClick={onClickAdd}
                        className="h-8 rounded border border-gray-300 px-3 text-xs font-medium text-gray-800 hover:bg-gray-50"
                    >
                        신규
                    </button>
                </div>
            </header>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full table-fixed text-left text-sm">
                    <thead className="bg-gray-100 text-xs font-semibold text-gray-700">
                    <tr>
                        <th className="w-28 px-3 py-2">플랫폼</th>
                        <th className="w-32 px-3 py-2">별명</th>
                        <th className="px-3 py-2">URL</th>
                        <th className="w-48 px-3 py-2">Note</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {platforms.map((platform) => {
                        const isSelected = platform.id === selectedPlatformId;
                        return (
                            <tr
                                key={platform.id}
                                className={
                                    "cursor-pointer hover:bg-gray-50 " +
                                    (isSelected ? "bg-blue-50" : "")
                                }
                                onClick={() => onSelectPlatform(platform.id)}
                            >
                                <td className="px-3 py-2">{platform.name}</td>
                                <td className="px-3 py-2">{platform.alias}</td>
                                <td className="px-3 py-2 text-blue-600 underline">
                                    {platform.url}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                    {platform.note ?? ""}
                                </td>
                            </tr>
                        );
                    })}
                    {platforms.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-3 py-6 text-center text-sm text-gray-400"
                            >
                                등록된 플랫폼이 없습니다.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

