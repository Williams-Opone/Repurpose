import { notFound } from "next/navigation";
import { z } from "zod";

import { Topbar } from "@/components/layout/topbar";
import { getVoice } from "@/features/voice";
import { VoiceDetail } from "@/features/voice/components/voice-detail";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Brand voice" };

export default async function VoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Validate before it reaches Postgres — a malformed uuid would throw, not 404.
  if (!z.uuid().safeParse(id).success) notFound();

  const userId = await requireUserId();
  const voice = await getVoice(id, userId);
  if (!voice) notFound();

  return (
    <>
      <Topbar title={voice.name} />
      <main className="flex-1 p-8">
        <VoiceDetail voice={voice} />
      </main>
    </>
  );
}
