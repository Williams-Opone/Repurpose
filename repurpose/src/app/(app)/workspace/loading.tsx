import { Topbar } from "@/components/layout/topbar";
import { Shimmer, ShimmerLines } from "@/components/motion/shimmer";

export default function WorkspaceLoading() {
  return (
    <>
      <Topbar title="Workspace" actions={<Shimmer className="h-8 w-40" />} />
      <div className="grid flex-1 grid-cols-[42%_1fr]">
        <div className="flex flex-col gap-6 border-r border-line p-6">
          <Shimmer className="h-[260px] w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="h-16 rounded-md" />
            ))}
          </div>
        </div>
        <div className="p-6">
          <ShimmerLines lines={4} className="max-w-sm" />
        </div>
      </div>
    </>
  );
}
