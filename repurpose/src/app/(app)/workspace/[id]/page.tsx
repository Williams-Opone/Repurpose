import { notFound } from "next/navigation";
import { z } from "zod";

import { getEntitlements } from "@/features/billing";
import { getGeneration } from "@/features/generate";
import { Workspace, type WorkspaceInitial } from "@/features/generate/components/workspace";
import { listVoices } from "@/features/voice";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Workspace" };

export default async function GenerationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const userId = await requireUserId();
  const [generation, voices, entitlements] = await Promise.all([
    getGeneration(id, userId),
    listVoices(userId),
    getEntitlements(userId),
  ]);
  if (!generation) notFound();

  const initial: WorkspaceInitial = {
    generation,
    outputs: generation.outputs.map((o) => ({
      format: o.format,
      outputId: o.id,
      content: o.content,
      tokensUsed: o.tokensUsed,
    })),
    edited: Object.fromEntries(
      generation.outputs.filter((o) => o.editedContent).map((o) => [o.id, o.editedContent!]),
    ),
  };

  return (
    <Workspace
      voices={voices.map((v) => ({ id: v.id, name: v.name, isDefault: v.isDefault }))}
      entitlements={entitlements}
      initial={initial}
    />
  );
}
