import { Topbar } from "@/components/layout/topbar";

export const metadata = { title: "Workspace" };

// Placeholder — replaced by the real workspace in Phase 7.
export default function WorkspacePage() {
  return (
    <>
      <Topbar title="Workspace" />
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="font-mono text-sm text-fg-2">workspace · arrives in phase 7</p>
      </main>
    </>
  );
}