import { z } from "zod";

import { getEntitlements } from "@/features/billing";
import { Workspace } from "@/features/generate/components/workspace";
import { getGenerationSource } from "@/features/history";
import { listVoices } from "@/features/voice";
import { requireUserId } from "@/lib/auth";

export const metadata = { title: "Workspace" };

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();
  const { from } = await searchParams;
  const fromId = typeof from === "string" && z.uuid().safeParse(from).success ? from : null;

  const [voices, entitlements, prefill] = await Promise.all([
    listVoices(userId),
    getEntitlements(userId),
    fromId ? getGenerationSource(fromId, userId) : null,
  ]);

  return (
    <Workspace
      voices={voices.map((v) => ({ id: v.id, name: v.name, isDefault: v.isDefault }))}
      entitlements={entitlements}
      initial={null}
      prefill={prefill}
    />
  );
}
