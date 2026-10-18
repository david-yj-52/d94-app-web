import type {Platform} from "./PlatformTable";
import type {Product} from "./ProductTable";

type Props = {
    platform: Platform | null;
    product: Product | null;
};

export default function DetailPanel({platform, product}: Props) {
    return (
        <section className="w-full flex-shrink-0 rounded-2xl bg-white p-4 shadow-md min-h-[460px] lg:w-80">
            <h2 className="mb-4 text-lg font-semibold">상세 정보</h2>

            <div className="space-y-4 text-sm">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                            플랫폼 설정 상세 정보
                        </h3>
                        <button
                            type="button"
                            className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                        >
                            수정
                        </button>
                    </div>

                    {platform ? (
                        <dl className="space-y-1 text-xs text-gray-700">
                            <DetailRow label="플랫폼 이름" value={platform.name}/>
                            <DetailRow label="플랫폼 별명" value={platform.alias}/>
                            <DetailRow label="접속 URL" value={platform.url} asLink/>
                            <DetailRow label="Note" value={platform.note ?? ""}/>
                            <DetailRow label="최초 생성일" value={platform.createdAt}/>
                            <DetailRow label="마지막 변경일" value={platform.updatedAt}/>
                        </dl>
                    ) : (
                        <p className="text-xs text-gray-400">
                            플랫폼을 선택하면 상세 정보가 표시됩니다.
                        </p>
                    )}
                </div>

                {product && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">제품 설정 상세 정보</h3>
                            <button
                                type="button"
                                className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                            >
                                수정
                            </button>
                        </div>

                        <dl className="space-y-1 text-xs text-gray-700">
                            <DetailRow label="제품 이름" value={product.name}/>
                            <DetailRow label="제품 별명" value={product.alias}/>
                            <DetailRow label="제품 URL" value={product.url} asLink/>
                            <DetailRow label="Note" value={product.note ?? ""}/>
                            <DetailRow label="최초 생성일" value={product.createdAt}/>
                            <DetailRow label="마지막 변경일" value={product.updatedAt}/>
                        </dl>
                    </div>
                )}
            </div>
        </section>
    );
}

function DetailRow({
                       label,
                       value,
                       asLink,
                   }: {
    label: string;
    value: string;
    asLink?: boolean;
}) {
    return (
        <div className="flex gap-2">
            <dt className="w-20 flex-shrink-0 text-gray-500">{label}</dt>
            <dd className="flex-1">
                {asLink && value ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                    >
                        {value}
                    </a>
                ) : (
                    <span>{value || "-"}</span>
                )}
            </dd>
        </div>
    );
}

