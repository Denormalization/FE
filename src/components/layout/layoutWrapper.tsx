'use client';

import { usePathname } from "next/navigation";
import BookShell from "@/components/layout/bookShell";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return <BookShell>{children}</BookShell>;
}
