import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { buttonVariants } from "@/components/ui/button";
import { hasAnyVoice } from "@/features/voice";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const userId = await requireUserId();
  if (await hasAnyVoice(userId)) redirect("/workspace");

  return (
    <>
      <Topbar title="Welcome" />
      <main className="flex flex-1 items-center justify-center p-8">
        <StaggerContainer className="flex max-w-md flex-col items-center gap-5 text-center">
          <StaggerItem>
            <span className="grid size-12 place-items-center rounded-lg bg-brand font-serif text-2xl text-brand-foreground">
              R
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="font-serif text-4xl">First, let&apos;s learn how you write.</h2>
          </StaggerItem>
          <StaggerItem>
            <p className="text-fg-1">
              Paste two or three past posts. We&apos;ll build a voice profile so everything we
              generate sounds like you — not like a robot.
            </p>
          </StaggerItem>
          <StaggerItem>
            <Link href="/voice/new" className={buttonVariants({ size: "lg" })}>
              Set up my brand voice
              <ArrowRight />
            </Link>
          </StaggerItem>
        </StaggerContainer>
      </main>
    </>
  );
}
