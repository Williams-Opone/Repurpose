import Link from "next/link";
import { Mic2, Plus } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { hoverLift } from "@/components/motion/motion.config";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listVoices } from "@/features/voice";
import { Chips } from "@/features/voice/components/voice-profile-card";
import { requireUserId } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Brand voice" };

export default async function VoicesPage() {
  const userId = await requireUserId();
  const voices = await listVoices(userId);

  return (
    <>
      <Topbar
        title="Brand voice"
        actions={
          <Link href="/voice/new" className={buttonVariants({ size: "sm" })}>
            <Plus />
            New voice
          </Link>
        }
      />
      <main className="flex-1 p-8">
        {voices.length === 0 ? (
          <StaggerContainer className="mx-auto flex max-w-sm flex-col items-center gap-4 pt-16 text-center">
            <StaggerItem>
              <span className="grid size-12 place-items-center rounded-lg bg-bg-2 text-fg-1">
                <Mic2 className="size-5" />
              </span>
            </StaggerItem>
            <StaggerItem>
              <h2 className="font-serif text-3xl">No voice yet.</h2>
            </StaggerItem>
            <StaggerItem>
              <p className="text-sm text-fg-1">
                Paste a few past posts and we&apos;ll learn how you write.
              </p>
            </StaggerItem>
            <StaggerItem>
              <Link href="/voice/new" className={buttonVariants()}>
                Set up my voice
              </Link>
            </StaggerItem>
          </StaggerContainer>
        ) : (
          <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {voices.map((v) => (
              <StaggerItem key={v.id} whileHover={hoverLift}>
                <Link
                  href={`/voice/${v.id}`}
                  className="flex h-full flex-col gap-4 rounded-lg surface-1 p-5 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-md bg-bg-2 text-fg-1">
                        <Mic2 className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="font-mono text-xs text-fg-2">
                          {v.samples.length} samples · {formatRelativeTime(v.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {v.isDefault && (
                      <Badge variant="outline" className="border-brand/30 text-brand">
                        Default
                      </Badge>
                    )}
                  </div>

                  {v.profile ? (
                    <>
                      <p className="line-clamp-2 font-serif text-lg leading-snug">
                        {v.profile.summary}
                      </p>
                      <Chips items={v.profile.tone.slice(0, 4)} />
                    </>
                  ) : (
                    <p className="text-sm text-warning">Not analyzed yet</p>
                  )}
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </main>
    </>
  );
}
