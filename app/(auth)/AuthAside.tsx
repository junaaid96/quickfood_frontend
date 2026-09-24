"use client";

import { ChatCircleDots, Crown, Leaf, Wallet } from "@phosphor-icons/react";

const perks = [
    { icon: Wallet, title: "Budget Bites", body: "Name a budget, get a full meal plan with fees included." },
    { icon: ChatCircleDots, title: "Live tracking and chat", body: "See every step and message the kitchen directly." },
    { icon: Leaf, title: "Wait & Save", body: "Batch your delivery with neighbours to pay less." },
    { icon: Crown, title: "Rewards", body: "Earn a point per dollar and redeem at checkout." },
];

export function AuthAside() {
    return (
        <aside className="hidden self-start rounded-[28px] bg-ink p-8 text-bg md:block lg:p-10">
            <p className="font-display text-3xl leading-tight font-extrabold">
                Good food should not
                <br />
                come with surprises.
            </p>
            <ul className="mt-8 space-y-6">
                {perks.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-bg/10 text-brand">
                            <Icon size={22} weight="duotone" />
                        </span>
                        <span>
                            <span className="block font-semibold">{title}</span>
                            <span className="block text-sm text-bg/65">{body}</span>
                        </span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
