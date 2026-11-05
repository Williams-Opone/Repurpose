import { cn } from "@/lib/utils";

type ShimmerProps = React.ComponentProps<"div">;

export function Shimmer({ className, ...props }: ShimmerProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-sm bg-bg-2",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-linear-to-r before:from-transparent before:via-white/[0.06] before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

/** Text-shaped skeleton: N lines, last one shorter. */
export function ShimmerLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Shimmer key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  );
}
