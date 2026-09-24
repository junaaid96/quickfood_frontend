"use client";

import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone; action?: { label: string; onClick: () => void } };
type ToastFn = (message: string, tone?: Tone, action?: Toast["action"]) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const toast = useCallback<ToastFn>(
        (message, tone = "success", action) => {
            const id = Date.now() + Math.random();
            setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
            setTimeout(() => dismiss(id), action ? 6000 : 3500);
        },
        [dismiss],
    );

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6"
            >
                {toasts.map((t) => {
                    const Icon = t.tone === "error" ? WarningCircle : t.tone === "info" ? Info : CheckCircle;
                    return (
                        <div
                            key={t.id}
                            role="status"
                            className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-card"
                        >
                            <Icon
                                size={20}
                                weight="fill"
                                className={t.tone === "error" ? "text-danger" : t.tone === "info" ? "text-bg" : "text-ok"}
                            />
                            <span className="flex-1">{t.message}</span>
                            {t.action && (
                                <button
                                    onClick={() => {
                                        t.action?.onClick();
                                        dismiss(t.id);
                                    }}
                                    className="font-semibold text-brand-soft underline-offset-2 hover:underline"
                                >
                                    {t.action.label}
                                </button>
                            )}
                            <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100">
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
