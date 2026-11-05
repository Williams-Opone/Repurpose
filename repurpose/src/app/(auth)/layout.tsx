import Link from "next/link";

import { FadeIn } from "@/components/motion/fade-in";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 glow-brand" />

      <FadeIn className="relative flex flex-col items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-sm">
          <span className="grid size-7 place-items-center rounded-sm bg-brand font-serif text-base text-brand-foreground">
            R
          </span>
          <span className="text-sm font-medium tracking-tight">{APP_NAME}</span>
        </Link>

        {children}

        <p className="max-w-xs text-center text-xs text-fg-2">
          Your writing samples stay private and are only used to shape your own outputs.
        </p>
      </FadeIn>
    </div>
  );
}
