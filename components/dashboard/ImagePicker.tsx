"use client";

import { useEffect, useState } from "react";
import { ImageSquare, UploadSimple } from "@phosphor-icons/react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Input } from "@/components/ui/Field";

export function ImagePicker({
    current,
    file,
    onFile,
    url,
    onUrl,
    cuisine,
    aspect = "aspect-[16/9]",
}: {
    current: string | null;
    file: File | null;
    onFile: (f: File | null) => void;
    url: string;
    onUrl: (u: string) => void;
    cuisine?: string;
    aspect?: string;
}) {
    const [preview, setPreview] = useState<string | null>(null);
    useEffect(() => {
        if (!file) return setPreview(null);
        const u = URL.createObjectURL(file);
        setPreview(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);

    return (
        <div>
            <span className="mb-1.5 block text-sm font-medium">Photo</span>
            <div className={`relative overflow-hidden rounded-2xl border border-line ${aspect}`}>
                <CoverImage src={preview ?? (url || current)} alt="Preview" cuisine={cuisine} className="size-full" />
                <label className="absolute right-3 bottom-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold shadow-card hover:text-brand">
                    <UploadSimple size={16} /> Upload
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
                </label>
            </div>
            <label className="mt-2 flex items-center gap-2">
                <ImageSquare size={18} className="shrink-0 text-muted" />
                <Input value={url} onChange={(e) => onUrl(e.target.value)} placeholder="...or paste an image URL" aria-label="Image URL" className="py-2 text-sm" />
            </label>
        </div>
    );
}
