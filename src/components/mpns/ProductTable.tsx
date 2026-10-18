export type Product = {
    id: string;
    platformId: string;
    name: string;
    alias: string;
    url: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
};

type Props = {
    products: Product[];
    selectedProductId: string | null;
    onSelectProduct: (id: string) => void;
    searchValue: string;
    onChangeSearch: (value: string) => void;
    onClickAdd: () => void;
    platformName: string;
    disabled?: boolean;
};

export default function ProductTable({
                                         products,
                                         selectedProductId,
                                         onSelectProduct,
                                         searchValue,
                                         onChangeSearch,
                                         onClickAdd,
                                         platformName,
                                         disabled,
                                     }: Props) {
    return (
        <section className="flex-1 rounded-2xl bg-white p-4 shadow-md min-h-[460px]">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">
                    {platformName ? `${platformName} 제품 설정` : "제품 설정"}
                </h2>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onChangeSearch(e.target.value)}
                        disabled={disabled}
                        className="h-8 w-32 rounded border border-gray-300 px-2 text-sm disabled:bg-gray-100"
                    />
                    <button
                        type="button"
                        disabled={disabled}
                        className="h-8 rounded bg-black px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        검색
                    </button>
                    <button
                        type="button"
                        onClick={onClickAdd}
                        disabled={disabled}
                        className="h-8 rounded border border-gray-300 px-3 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                        신규
                    </button>
                </div>
            </header>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="min-w-full table-fixed text-left text-sm">
                    <thead className="bg-gray-100 text-xs font-semibold text-gray-700">
                    <tr>
                        <th className="w-32 px-3 py-2">제품명</th>
                        <th className="w-32 px-3 py-2">별명</th>
                        <th className="px-3 py-2">제품 URL</th>
                        <th className="w-48 px-3 py-2">Note</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {products.map((product) => {
                        const isSelected = product.id === selectedProductId;
                        return (
                            <tr
                                key={product.id}
                                className={
                                    "cursor-pointer hover:bg-gray-50 " +
                                    (isSelected ? "bg-blue-50" : "")
                                }
                                onClick={() => onSelectProduct(product.id)}
                            >
                                <td className="px-3 py-2">{product.name}</td>
                                <td className="px-3 py-2">{product.alias}</td>
                                <td className="px-3 py-2 text-blue-600 underline">
                                    {product.url}
                                </td>
                                <td className="px-3 py-2 text-gray-600">
                                    {product.note ?? ""}
                                </td>
                            </tr>
                        );
                    })}
                    {products.length === 0 && (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-3 py-6 text-center text-sm text-gray-400"
                            >
                                {disabled
                                    ? "플랫폼을 먼저 선택해 주세요."
                                    : "등록된 제품이 없습니다."}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

