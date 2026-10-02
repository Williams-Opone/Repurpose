import { Topbar } from "@/components/layout/topbar";
import { VoiceSetupFlow } from "@/features/voice/components/voice-setup-flow";

export const metadata = { title: "New voice" };

export default function NewVoicePage() {
  return (
    <>
      <Topbar title="New voice" />
      <main className="flex-1 p-8">
        <VoiceSetupFlow />
      </main>
    </>
  );
}
