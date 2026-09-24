"use client";

import { useState } from "react";
import { cuisineMeta } from "@/lib/cuisine";
import { cn } from "@/lib/format";

/**
 * Photo with a designed fallback: if there is no image (or it fails to load) we paint a warm
 * cuisine-tinted panel with the cuisine icon, so cards never look broken.
 */
export function CoverImage({
    src,
    alt,
    cuisine,
    className,
    iconSize = 40,
    priority,
}: {
    src: string | null | undefined;
    alt: string;
    cuisine?: string;
    className?: string;
    iconSize?: number;
    priority?: boolean;
}) {
    const [failed, setFailed] = useState(false);
    const { icon: Icon, hue } = cuisineMeta(cuisine);

    if (!src || failed) {
        return (
            <div
                role="img"
                aria-label={alt}
                className={cn("grid place-items-center overflow-hidden", className)}
                style={{
                    background: `radial-gradient(120% 90% at 20% 10%, hsl(${hue} 70% 88% / 0.95), transparent 60%), linear-gradient(135deg, hsl(${hue} 55% 72%), hsl(${(hue + 25) % 360} 50% 52%))`,
                }}
            >
                <Icon size={iconSize} weight="duotone" className="text-white/85 drop-shadow-sm" />
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            onError={() => setFailed(true)}
            className={cn("object-cover", className)}
        />
    );
}
