import { Shimmer, ShimmerLines } from "@/components/motion/shimmer";
import type { OutputContent } from "@/types";

export function OutputSkeleton({ kind }: { kind: OutputContent["kind"] }) {
  if (kind === "thread") {
    return (
      <div className="flex flex-col gap-4">
        {[3, 2, 2].map((lines, i) => (
          <div key={i} className="flex gap-3">
            <Shimmer className="mt-1.5 size-2 rounded-full" />
            <ShimmerLines lines={lines} className="flex-1" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "newsletter") {
    return (
      <div className="flex flex-col gap-4">
        <Shimmer className="h-5 w-2/3" />
        <ShimmerLines lines={6} />
      </div>
    );
  }
  if (kind === "caption") {
    return (
      <div className="flex flex-col gap-4">
        <ShimmerLines lines={4} />
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Shimmer key={i} className="h-5 w-16" />
          ))}
        </div>
      </div>
    );
  }
  return <ShimmerLines lines={7} />;
}
