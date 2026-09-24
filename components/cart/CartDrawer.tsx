"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingBag, X } from "@phosphor-icons/react";
import { useCart } from "@/providers/cart-provider";
import { useAuth } from "@/providers/auth-provider";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Bits";
import { CoverImage } from "@/components/ui/CoverImage";
import { money, num } from "@/lib/format";

export default function CartDrawer() {
    const cart = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const minOrder = num(cart.restaurant?.min_order);
    const short = Math.max(0, minOrder - cart.subtotal);

    const checkout = () => {
        cart.close();
        router.push(isAuthenticated ? "/checkout" : "/login?redirect=/checkout");
    };

    return (
        <Drawer open={cart.isOpen} onClose={cart.close} label="Your basket">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                    <h2 className="text-lg font-bold">Your basket</h2>
                    {cart.restaurant && (
                        <Link href={`/restaurants/${cart.restaurant.id}`} onClick={cart.close} className="text-sm text-muted hover:text-brand">
                            from {cart.restaurant.name}
                        </Link>
                    )}
                </div>
                <button onClick={cart.close} aria-label="Close basket" className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink">
                    <X size={20} />
                </button>
            </div>

            {cart.lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                        <ShoppingBag size={30} />
                    </div>
                    <p className="text-lg font-bold">Nothing here yet</p>
                    <p className="mt-1 text-muted">Add a few dishes and they will wait for you here, even if you close the tab.</p>
                    <Button className="mt-6" onClick={() => { cart.close(); router.push("/restaurants"); }}>
                        Find something tasty
                    </Button>
                </div>
            ) : (
                <>
                    <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                        {cart.lines.map(({ item, quantity, note }) => (
                            <li key={item.id} className="flex gap-3 py-4">
                                <CoverImage src={item.cover_image} alt="" cuisine={cart.restaurant?.cuisine} iconSize={20} className="size-16 shrink-0 rounded-xl" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold leading-tight">{item.name}</p>
                                        <p className="tabular font-semibold">{money(num(item.price) * quantity)}</p>
                                    </div>
                                    <input
                                        value={note}
                                        onChange={(e) => cart.setNote(item.id, e.target.value.slice(0, 140))}
                                        placeholder="Add a note (no onions...)"
                                        aria-label={`Note for ${item.name}`}
                                        className="mt-1 w-full bg-transparent text-sm text-muted placeholder:text-muted/60 focus:text-ink focus:outline-none"
                                    />
                                    <div className="mt-2">
                                        <Stepper size="sm" label={item.name} value={quantity} onChange={(q) => cart.setQuantity(item.id, q)} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="border-t border-line p-5">
                        {short > 0 && (
                            <div className="mb-4">
                                <div className="mb-1.5 flex justify-between text-sm">
                                    <span className="text-muted">Minimum order {money(minOrder)}</span>
                                    <span className="font-semibold">{money(short)} to go</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                                    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (cart.subtotal / minOrder) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                        <div className="mb-4 flex items-baseline justify-between">
                            <span className="text-muted">Subtotal</span>
                            <span className="tabular text-xl font-bold">{money(cart.subtotal)}</span>
                        </div>
                        <Button size="lg" className="w-full" disabled={short > 0} onClick={checkout}>
                            Go to checkout <ArrowRight size={18} weight="bold" />
                        </Button>
                        <p className="mt-2 text-center text-xs text-muted">Fees, promos and rewards are applied at checkout.</p>
                    </div>
                </>
            )}
        </Drawer>
    );
}
