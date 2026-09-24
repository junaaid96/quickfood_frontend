"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowSquareOut, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { request } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { cn, money } from "@/lib/format";
import type { MenuItem, RestaurantDetail, Review } from "@/lib/types";
import { useToast } from "@/providers/toast-provider";
import { Badge, EmptyState, Segmented, Skeleton } from "@/components/ui/Bits";
import { Button, LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { Modal } from "@/components/ui/Overlay";
import { DietaryTags } from "@/components/restaurant/Dietary";
import { MenuItemForm } from "@/components/dashboard/MenuItemForm";
import { RestaurantForm } from "@/components/dashboard/RestaurantForm";
import { ReviewReplyList } from "@/components/dashboard/ReviewReplyList";

type Tab = "menu" | "details" | "reviews";

export default function ManageRestaurantPage() {
    return (
        <Suspense>
            <ManageRestaurant />
        </Suspense>
    );
}

function ManageRestaurant() {
    const { id } = useParams<{ id: string }>();
    const params = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "menu");
    const { data: r, mutate } = useApi<RestaurantDetail>(`/restaurants/restaurant/${id}/`);
    const { data: reviews, mutate: mutateReviews } = useApi<Review[]>(`/restaurants/reviews/?restaurant=${id}`);
    const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
    const [deleting, setDeleting] = useState<MenuItem | null>(null);
    const [deleteRestaurant, setDeleteRestaurant] = useState(false);

    if (!r) {
        return (
            <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-96 rounded-3xl" />
            </div>
        );
    }

    const toggleAvailable = async (item: MenuItem) => {
        mutate({ ...r, menu_items: r.menu_items.map((m) => (m.id === item.id ? { ...m, is_available: !m.is_available } : m)) }, { revalidate: false });
        try {
            await request(`/restaurants/menu-items/${item.id}/`, { method: "PATCH", body: { is_available: !item.is_available } });
            toast(item.is_available ? `${item.name} marked sold out` : `${item.name} is back on`, "info");
        } catch (e) {
            toast((e as Error).message, "error");
            mutate();
        }
    };

    const removeItem = async () => {
        if (!deleting) return;
        try {
            await request(`/restaurants/menu-items/${deleting.id}/`, { method: "DELETE" });
            toast("Dish removed");
            mutate();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setDeleting(null);
        }
    };

    const categories = r.categories;
    const grouped = categories.map((c) => [c, r.menu_items.filter((i) => i.category === c)] as const);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <Link href="/dashboard/restaurants" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                <ArrowLeft size={16} /> Your restaurants
            </Link>
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <CoverImage src={r.cover_image} alt={r.name} cuisine={r.cuisine} className="h-24 w-full shrink-0 rounded-2xl sm:w-40" />
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold">{r.name}</h1>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone={r.is_open ? "ok" : "warn"}>{r.is_open ? "Open" : r.is_accepting_orders ? "Outside hours" : "Paused"}</Badge>
                        <Badge>{r.menu_items.length} dishes</Badge>
                        <Badge>{r.menu_items.filter((m) => !m.is_available).length} sold out</Badge>
                    </div>
                </div>
                <LinkButton href={`/restaurants/${r.id}`} variant="outline" size="sm" icon={<ArrowSquareOut size={16} />}>
                    Customer view
                </LinkButton>
            </div>

            <Segmented
                className="mt-8"
                value={tab}
                onChange={(t) => {
                    setTab(t);
                    router.replace(`?tab=${t}`, { scroll: false });
                }}
                options={[
                    { value: "menu", label: "Menu" },
                    { value: "details", label: "Details" },
                    { value: "reviews", label: `Reviews (${r.review_count})` },
                ]}
            />

            <div className="mt-6">
                {tab === "menu" && (
                    <>
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm text-muted">Toggle a dish off when it sells out. It hides instantly for customers.</p>
                            <Button size="sm" onClick={() => setEditing("new")} icon={<Plus size={16} weight="bold" />}>
                                Add dish
                            </Button>
                        </div>
                        {r.menu_items.length === 0 ? (
                            <EmptyState icon={<Plus size={26} />} title="Your menu is empty" body="Add a few dishes to go live. Group them with categories like Mains, Sides and Drinks." action={<Button onClick={() => setEditing("new")}>Add your first dish</Button>} />
                        ) : (
                            <div className="space-y-8">
                                {grouped.map(([cat, list]) => (
                                    <section key={cat}>
                                        <h2 className="mb-3 text-lg font-bold">{cat}</h2>
                                        <ul className="divide-y divide-line rounded-3xl border border-line bg-surface">
                                            {list.map((item) => (
                                                <li key={item.id} className={cn("flex items-center gap-4 p-4", !item.is_available && "opacity-60")}>
                                                    <CoverImage src={item.cover_image} alt="" cuisine={r.cuisine} iconSize={18} className="size-14 shrink-0 rounded-xl" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="truncate text-sm text-muted">{item.description}</p>
                                                        <div className="mt-1">
                                                            <DietaryTags item={item} compact />
                                                        </div>
                                                    </div>
                                                    <span className="tabular hidden font-semibold sm:block">{money(item.price)}</span>
                                                    <button
                                                        onClick={() => toggleAvailable(item)}
                                                        className={cn("hidden rounded-full px-3 py-1 text-xs font-bold sm:block", item.is_available ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger")}
                                                    >
                                                        {item.is_available ? "Available" : "Sold out"}
                                                    </button>
                                                    <button onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`} className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink">
                                                        <PencilSimple size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleting(item)} aria-label={`Delete ${item.name}`} className="rounded-full p-2 text-muted hover:bg-danger-soft hover:text-danger">
                                                        <Trash size={18} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === "details" && (
                    <>
                        <RestaurantForm restaurant={r} onSaved={() => mutate()} />
                        <div className="mt-12 rounded-3xl border border-danger/30 p-5">
                            <h2 className="font-bold text-danger">Delete restaurant</h2>
                            <p className="mt-1 text-sm text-muted">Removes the restaurant, its menu and its order history. This can&apos;t be undone.</p>
                            <Button variant="danger" size="sm" className="mt-4" onClick={() => setDeleteRestaurant(true)}>
                                Delete {r.name}
                            </Button>
                        </div>
                    </>
                )}

                {tab === "reviews" && <ReviewReplyList reviews={reviews ?? []} onReplied={() => mutateReviews()} />}
            </div>

            <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Add a dish" : "Edit dish"}>
                {editing && (
                    <MenuItemForm
                        key={editing === "new" ? "new" : editing.id}
                        restaurantId={r.id}
                        cuisine={r.cuisine}
                        item={editing === "new" ? undefined : editing}
                        categories={categories.length ? categories : ["Mains", "Sides", "Drinks", "Desserts"]}
                        onSaved={() => {
                            setEditing(null);
                            mutate();
                        }}
                    />
                )}
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${deleting?.name}?`}>
                <p className="text-muted">If it&apos;s just sold out today, mark it unavailable instead. Deleting removes it for good.</p>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleting(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={removeItem}>
                        Delete dish
                    </Button>
                </div>
            </Modal>

            <Modal open={deleteRestaurant} onClose={() => setDeleteRestaurant(false)} title={`Delete ${r.name}?`}>
                <p className="text-muted">This removes all dishes, orders and reviews for this restaurant.</p>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteRestaurant(false)}>
                        Keep it
                    </Button>
                    <Button
                        variant="danger"
                        onClick={async () => {
                            try {
                                await request(`/restaurants/restaurant/${r.id}/`, { method: "DELETE" });
                                toast("Restaurant deleted");
                                router.push("/dashboard/restaurants");
                            } catch (e) {
                                toast((e as Error).message, "error");
                            }
                        }}
                    >
                        Delete forever
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
