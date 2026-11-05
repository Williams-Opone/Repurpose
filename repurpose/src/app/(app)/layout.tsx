import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CommandPalette } from "@/components/layout/command-palette";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { PageTransition } from "@/components/motion/page-transition";
import { ensureUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in"); // proxy already guards; this satisfies TS and defense-in-depth

  await ensureUser(userId);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar footer={<UserMenu />} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PageTransition className="flex min-h-0 flex-1 flex-col">{children}</PageTransition>
      </div>
      <CommandPalette />
    </div>
  );
}
