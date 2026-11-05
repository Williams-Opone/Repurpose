"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CreditCard, History, Mic2, Sparkles } from "lucide-react";

import { springs } from "@/components/motion/motion.config";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/workspace", label: "Workspace", icon: Sparkles },
  { href: "/history", label: "History", icon: History },
  { href: "/voice", label: "Brand voice", icon: Mic2 },
  { href: "/billing", label: "Billing", icon: CreditCard },
] as const;

export function Sidebar({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg-0 px-3 py-4">
      <Link href="/workspace" className="mb-6 flex items-center gap-2.5 rounded-sm px-2 py-1">
        <span className="grid size-6 place-items-center rounded-sm bg-brand font-serif text-sm text-brand-foreground">
          R
        </span>
        <span className="text-sm font-medium tracking-tight">{APP_NAME}</span>
      </Link>

      <nav className="flex flex-col gap-0.5" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                active ? "text-fg-0" : "text-fg-1 hover:bg-bg-1 hover:text-fg-0",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md bg-bg-2 raised"
                  transition={springs.ui}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
