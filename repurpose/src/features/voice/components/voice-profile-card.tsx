"use client";

import { StaggerContainer, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VoiceProfile } from "@/types";

import { POV_LABELS, SENTENCE_LABELS } from "../schema";

export function Chips({ items, mono = false }: { items: string[]; mono?: boolean }) {
  return (
    <StaggerContainer className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <StaggerItem key={`${item}-${i}`}>
          <Badge variant="secondary" className={cn("font-normal", mono && "font-mono text-xs")}>
            {item}
          </Badge>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">{label}</span>
      <span className="text-sm text-fg-0">{value}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">{title}</h3>
      {children}
    </div>
  );
}

export function VoiceProfileCard({
  profile,
  className,
}: {
  profile: VoiceProfile;
  className?: string;
}) {
  const { formatting } = profile;
  const uses =
    [formatting.lists && "lists", formatting.hashtags && "hashtags"].filter(Boolean).join(", ") ||
    "neither lists nor hashtags";

  return (
    <div className={cn("flex flex-col gap-7 rounded-lg surface-1 p-6", className)}>
      <p className="font-serif text-2xl leading-snug text-balance text-fg-0">{profile.summary}</p>

      <Block title="Tone">
        <Chips items={profile.tone} />
      </Block>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Fact label="Point of view" value={POV_LABELS[profile.pointOfView]} />
        <Fact label="Sentences" value={SENTENCE_LABELS[profile.sentenceLength]} />
        <Fact label="Emojis" value={formatting.emojis} />
        <Fact label="Uses" value={uses} />
      </div>

      {profile.structuralHabits.length > 0 && (
        <Block title="Structural habits">
          <ul className="flex flex-col gap-1.5 text-sm text-fg-1">
            {profile.structuralHabits.map((h) => (
              <li key={h} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                {h}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {profile.signaturePhrases.length > 0 && (
        <Block title="Signature phrases">
          <Chips items={profile.signaturePhrases} mono />
        </Block>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {profile.vocabulary.favors.length > 0 && (
          <Block title="Favors">
            <Chips items={profile.vocabulary.favors} />
          </Block>
        )}
        {profile.vocabulary.avoids.length > 0 && (
          <Block title="Avoids">
            <Chips items={profile.vocabulary.avoids} />
          </Block>
        )}
      </div>
    </div>
  );
}
