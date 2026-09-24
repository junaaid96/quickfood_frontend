"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { fetcher } from "./api";

export function useApi<T>(path: string | null, config?: SWRConfiguration<T>) {
    return useSWR<T>(path, fetcher, { revalidateOnFocus: false, ...config });
}
