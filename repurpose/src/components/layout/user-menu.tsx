"use client";

import Image from "next/image";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronsUpDown, CreditCard, LogOut, Settings } from "lucide-react";

import { Shimmer } from "@/components/motion/shimmer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <Shimmer className="size-7 rounded-full" />
        <Shimmer className="h-3 w-24" />
      </div>
    );
  }

  const name = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-1"
          />
        }
      >
        <Image src={user.imageUrl} alt="" width={28} height={28} className="rounded-full" />
        <span className="min-w-0 flex-1 truncate text-sm text-fg-0">{name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-fg-2" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem onClick={() => openUserProfile()}>
          <Settings />
          Manage account
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/billing" />}>
          <CreditCard />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ redirectUrl: "/" })}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
