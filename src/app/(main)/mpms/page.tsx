"use client";

import {useMemo, useState} from "react";
import PlatformTable, {Platform,} from "@/components/mpns/PlatformTable";
import ProductTable, {Product,} from "@/components/mpns/ProductTable";
import DetailPanel from "@/components/mpns/DetailPanel";
import PlatformAddPopup from "@/components/mpns/PlatformAddPopup";
import ProductAddPopup from "@/components/mpns/ProductAddPopup";

// TODO: 실제 백엔드 연동 시 API 호출로 교체
const MOCK_PLATFORMS: Platform[] = [
    {
        id: "1",
        name: "Lazada",
        alias: "라자다",
        url: "http://lazada.co.vn",
        note: "베트남 시장 온라인 쇼핑몰",
        createdAt: "2026-01-27 15:42",
        updatedAt: "2026-01-27 17:20",
    },
    {
        id: "2",
        name: "TaoBao",
        alias: "타오바오",
        url: "http://taobao.co.cn",
        note: "중국 최대 B2C 온라인 쇼핑몰",
        createdAt: "2026-01-27 15:42",
        updatedAt: "2026-01-27 17:20",
    },
];

const MOCK_PRODUCTS: Product[] = [
    {
        id: "p1",
        platformId: "1",
        name: "Boss EarBud",
        alias: "보스 귀마개",
        url: "https://lazada.co.vn/?prod_id=49239s9few3",
        note: "",
        createdAt: "2026-01-27 15:42",
        updatedAt: "2026-01-27 17:20",
    },
    {
        id: "p2",
        platformId: "1",
        name: "Boss EarPlug",
        alias: "보스 귀마개",
        url: "https://lazada.co.vn/?prod_id=4V1V23WJ4few3",
        note: "",
        createdAt: "2026-01-27 15:42",
        updatedAt: "2026-01-27 17:20",
    },
    {
        id: "p3",
        platformId: "1",
        name: "Boss Warmer",
        alias: "보스 외투",
        url: "https://lazada.co.vn/?prod_id=123H20W3",
        note: "26 01 가장 많이 팔아본 제품",
        createdAt: "2026-01-27 15:42",
        updatedAt: "2026-01-27 17:20",
    },
];

export default function MpnsPage() {
    const [platforms, setPlatforms] = useState<Platform[]>(MOCK_PLATFORMS);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

    const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
        platforms[0]?.id ?? null,
    );
    const [selectedProductId, setSelectedProductId] = useState<string | null>(
        null,
    );

    const [platformSearch, setPlatformSearch] = useState("");
    const [productSearch, setProductSearch] = useState("");

    const [isPlatformPopupOpen, setPlatformPopupOpen] = useState(false);
    const [isProductPopupOpen, setProductPopupOpen] = useState(false);

    const filteredPlatforms = useMemo(
        () =>
            platforms.filter((p) =>
                [p.name, p.alias, p.url, p.note]
                    .filter(Boolean)
                    .some((value) =>
                        value!.toLowerCase().includes(platformSearch.toLowerCase()),
                    ),
            ),
        [platforms, platformSearch],
    );

    const filteredProducts = useMemo(
        () =>
            products.filter(
                (p) =>
                    p.platformId === selectedPlatformId &&
                    [p.name, p.alias, p.url, p.note]
                        .filter(Boolean)
                        .some((value) =>
                            value!.toLowerCase().includes(productSearch.toLowerCase()),
                        ),
            ),
        [products, selectedPlatformId, productSearch],
    );

    const selectedPlatform = useMemo(
        () => platforms.find((p) => p.id === selectedPlatformId) ?? null,
        [platforms, selectedPlatformId],
    );

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === selectedProductId) ?? null,
        [products, selectedProductId],
    );

    const handleAddPlatform = (data: {
        name: string;
        alias: string;
        url: string;
        note?: string;
    }) => {
        const now = new Date().toISOString().replace("T", " ").slice(0, 16);
        const newPlatform: Platform = {
            id: String(Date.now()),
            name: data.name,
            alias: data.alias,
            url: data.url,
            note: data.note ?? "",
            createdAt: now,
            updatedAt: now,
        };
        setPlatforms((prev) => [...prev, newPlatform]);
        setSelectedPlatformId(newPlatform.id);
        setPlatformPopupOpen(false);
    };

    const handleAddProduct = (data: {
        name: string;
        alias: string;
        url: string;
        note?: string;
    }) => {
        if (!selectedPlatformId) return;
        const now = new Date().toISOString().replace("T", " ").slice(0, 16);
        const newProduct: Product = {
            id: String(Date.now()),
            platformId: selectedPlatformId,
            name: data.name,
            alias: data.alias,
            url: data.url,
            note: data.note ?? "",
            createdAt: now,
            updatedAt: now,
        };
        setProducts((prev) => [...prev, newProduct]);
        setSelectedProductId(newProduct.id);
        setProductPopupOpen(false);
    };

    return (
        <>
            <div className="flex flex-col gap-6 px-4 pb-8 lg:flex-row lg:px-8">
                <PlatformTable
                    platforms={filteredPlatforms}
                    selectedPlatformId={selectedPlatformId}
                    onSelectPlatform={(id) => {
                        setSelectedPlatformId(id);
                        setSelectedProductId(null);
                    }}
                    searchValue={platformSearch}
                    onChangeSearch={setPlatformSearch}
                    onClickAdd={() => setPlatformPopupOpen(true)}
                />

                <ProductTable
                    products={filteredProducts}
                    selectedProductId={selectedProductId}
                    onSelectProduct={setSelectedProductId}
                    searchValue={productSearch}
                    onChangeSearch={setProductSearch}
                    onClickAdd={() => setProductPopupOpen(true)}
                    platformName={selectedPlatform?.name ?? ""}
                    disabled={!selectedPlatformId}
                />

                <DetailPanel
                    platform={selectedPlatform}
                    product={selectedProduct}
                />
            </div>

            <PlatformAddPopup
                open={isPlatformPopupOpen}
                onClose={() => setPlatformPopupOpen(false)}
                onSubmit={handleAddPlatform}
            />

            <ProductAddPopup
                open={isProductPopupOpen}
                onClose={() => setProductPopupOpen(false)}
                onSubmit={handleAddProduct}
                platformName={selectedPlatform?.name ?? ""}
            />
        </>
    );
}

