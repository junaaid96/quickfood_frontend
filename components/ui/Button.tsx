import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";
const variants: Record<Variant, string> = {
    primary: "bg-brand text-brand-ink hover:bg-brand-strong shadow-card",
    secondary: "bg-ink text-bg hover:opacity-90",
    outline: "border border-line bg-surface text-ink hover:border-ink/30",
    ghost: "text-ink hover:bg-surface-2",
    danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white",
};
const sizes: Record<Size, string> = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[15px]",
    lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
    return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode };

export function Button({ variant = "primary", size = "md", loading, icon, className, children, disabled, ...rest }: ButtonProps) {
    return (
        <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
            {loading ? <CircleNotch size={18} className="animate-spin" /> : icon}
            {children}
        </button>
    );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function LinkButton({ variant = "primary", size = "md", icon, className, children, ...rest }: LinkButtonProps) {
    return (
        <Link className={buttonClass(variant, size, className)} {...rest}>
            {icon}
            {children}
        </Link>
    );
}
