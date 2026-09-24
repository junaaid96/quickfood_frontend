import { OwnerGuard } from "@/components/dashboard/OwnerGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <OwnerGuard>{children}</OwnerGuard>;
}
