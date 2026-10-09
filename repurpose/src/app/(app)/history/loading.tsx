import { Topbar } from "@/components/layout/topbar";
import { Shimmer } from "@/components/motion/shimmer";

export default function HistoryLoading() {
  return (
    <>
      <Topbar title="History" />
      <main className="flex-1 p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Shimmer className="h-8 w-80" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Shimmer key={i} className="h-[68px] rounded-md" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
