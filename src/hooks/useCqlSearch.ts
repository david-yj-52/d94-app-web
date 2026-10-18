"use client";

import type {CqlSearchRequest} from "@/lib/api/cql";
import {autocompleteCql, searchByCql, validateCql} from "@/lib/api/cql";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

export function useCqlSearch(
    cql: string,
    page = 0,
    size = 20,
    enabled = false,
) {
    return useQuery({
        queryKey: ["cql-search", cql, page, size],
        queryFn: () => searchByCql({cql, page, size} as CqlSearchRequest),
        enabled: enabled && !!cql.trim(),
    });
}

export function useCqlValidate(cql: string) {
    const [debouncedCql, setDebouncedCql] = useState(cql);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedCql(cql), 500);
        return () => clearTimeout(timer);
    }, [cql]);

    return useQuery({
        queryKey: ["cql-validate", debouncedCql],
        queryFn: () => validateCql(debouncedCql),
        enabled: !!debouncedCql.trim(),
        staleTime: 30_000,
    });
}

export function useCqlAutocomplete(cql: string, cursor: number) {
    return useQuery({
        queryKey: ["cql-autocomplete", cql, cursor],
        queryFn: () => autocompleteCql(cql, cursor),
        enabled: !!cql.trim(),
        staleTime: 10_000,
    });
}
