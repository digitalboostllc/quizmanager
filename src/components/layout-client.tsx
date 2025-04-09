'use client';

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function LayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith('/dashboard') || false;

  return (
    <div className="relative flex min-h-screen flex-col">
      {!isDashboardPage && <Header />}
      <main className="flex-1">{children}</main>
      {!isDashboardPage && <Footer />}
    </div>
  );
} 