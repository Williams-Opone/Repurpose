import { MAX_SOURCE_WORDS, MIN_SOURCE_WORDS, SOURCE_WARN_WORDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function WordCounter({ words, className }: { words: number; className?: string }) {
  const over = words > MAX_SOURCE_WORDS;
  const near = !over && words >= SOURCE_WARN_WORDS;
  const short = words > 0 && words < MIN_SOURCE_WORDS;

  return (
    <span
      aria-live="polite"
      className={cn(
        "font-mono text-xs tabular-nums",
        over ? "text-danger" : near || short ? "text-warning" : "text-fg-2",
        className,
      )}
    >
      {words.toLocaleString()} / {MAX_SOURCE_WORDS.toLocaleString()} words
      {over && ` · will be trimmed to ${MAX_SOURCE_WORDS.toLocaleString()}`}
      {short && ` · ${MIN_SOURCE_WORDS - words} more needed`}
    </span>
  );
}
