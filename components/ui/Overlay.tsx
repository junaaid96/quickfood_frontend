"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/format";

function useOverlay(open: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);
}

/** Centered dialog on desktop, bottom sheet on phones. */
export function Modal({
    open,
    onClose,
    title,
    children,
    className,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
}) {
    useOverlay(open, onClose);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
            <div
                className={cn(
                    "relative max-h-[92dvh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-card sm:max-w-lg sm:rounded-3xl",
                    className,
                )}
            >
                {title && (
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <h2 className="text-xl font-bold">{title}</h2>
                        <button onClick={onClose} aria-label="Close" className="-m-1 rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink">
                            <X size={20} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

/** Right-hand drawer. */
export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
    useOverlay(open, onClose);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={label}>
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
            <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-surface shadow-card">
                {children}
            </aside>
        </div>
    );
}
