"use client";

import { useRef, useState } from "react";
import { FileUp, Link2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { springs } from "@/components/motion/motion.config";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { cn, countWords } from "@/lib/utils";

import { fetchSource } from "../actions";
import { detectInput, youtubeThumbnail, type RemoteDetected } from "../detect";
import { buildSource } from "../normalize";
import type { Source } from "../types";
import { RemoteSourceCard, type RemoteCardProps } from "./remote-source-card";
import { WordCounter } from "./word-counter";

type RemoteState =
  | { status: "idle" }
  | { status: "loading"; detected: RemoteDetected }
  | { status: "error"; detected: RemoteDetected; message: string };

type Props = {
  value: Source | null;
  onChange: (source: Source | null) => void;
  disabled?: boolean;
  className?: string;
};

const ACCEPTED_FILE = /\.(txt|md|markdown)$/i;

export function SourceInput({ value, onChange, disabled, className }: Props) {
  const [draft, setDraft] = useState(value?.type === "paste" ? value.text : "");
  const [remote, setRemote] = useState<RemoteState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const remoteValue = value && value.type !== "paste" ? value : null;
  const showCard = remoteValue !== null || remote.status !== "idle";
  const typed = showCard ? null : detectInput(draft);
  const typedRemote = typed && typed.kind !== "text" ? typed : null;

  function setText(text: string) {
    setDraft(text);
    onChange(text.trim() ? buildSource({ type: "paste", text }) : null);
  }

  async function importFrom(detected: RemoteDetected) {
    onChange(null);
    setRemote({ status: "loading", detected });
    const res = await fetchSource({ url: detected.url });
    if (!res.ok) {
      setRemote({ status: "error", detected, message: res.message });
      return;
    }
    onChange(res.data);
    setRemote({ status: "idle" });
  }

  function clear() {
    setRemote({ status: "idle" });
    setDraft("");
    onChange(null);
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Only hijack a paste into an EMPTY field; pasting a link mid-paragraph stays text.
    if (draft.trim()) return;
    const detected = detectInput(e.clipboardData.getData("text"));
    if (detected.kind === "text") return;
    e.preventDefault();
    void importFrom(detected);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_FILE.test(file.name)) return void toast.error("Drop a .txt or .md file.");
    if (file.size > MAX_UPLOAD_BYTES) return void toast.error("That file is over 1 MB.");
    setText(await file.text());
  }

  const card: RemoteCardProps | null = remoteValue
    ? {
        kind: remoteValue.type === "youtube" ? "youtube" : "url",
        status: "ready",
        url: remoteValue.url ?? "",
        title: remoteValue.title,
        author: remoteValue.author,
        thumbnailUrl: remoteValue.thumbnailUrl,
        wordCount: remoteValue.wordCount,
        truncated: remoteValue.truncated,
        onClear: clear,
        disabled,
      }
    : remote.status !== "idle"
      ? {
          kind: remote.detected.kind,
          status: remote.status,
          url: remote.detected.url,
          thumbnailUrl:
            remote.detected.kind === "youtube" ? youtubeThumbnail(remote.detected.videoId) : null,
          message: remote.status === "error" ? remote.message : undefined,
          onRetry: remote.status === "error" ? () => void importFrom(remote.detected) : undefined,
          onClear: clear,
          disabled,
        }
      : null;

  return (
    <div
      className={cn("relative", className)}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) void onFile(e.dataTransfer.files[0]);
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {card ? (
          <motion.div
            key="card"
            layoutId="source-surface"
            transition={springs.ui}
            className={cn(
              "rounded-lg surface-1",
              card.status === "error" && "border-danger/30",
              card.status === "ready" && "border-brand/30",
            )}
          >
            <RemoteSourceCard {...card} />
          </motion.div>
        ) : (
          <motion.div
            key="text"
            layoutId="source-surface"
            transition={springs.ui}
            className={cn(
              "flex flex-col rounded-lg surface-1 transition-colors focus-within:border-line-strong",
              dragging && "border-brand/50 bg-brand/5",
            )}
          >
            <textarea
              value={draft}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && typedRemote) {
                  e.preventDefault();
                  void importFrom(typedRemote);
                }
              }}
              disabled={disabled}
              spellCheck={false}
              aria-label="Source content"
              placeholder="Paste a blog post, a transcript, or a YouTube link. Or drop a .txt / .md file here."
              className="min-h-[260px] w-full flex-1 resize-none bg-transparent px-5 pt-5 text-[15px] leading-relaxed text-fg-0 placeholder:text-fg-2 focus:outline-none disabled:opacity-50"
            />

            <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              <WordCounter words={countWords(draft)} />
              <div className="flex items-center gap-1.5">
                {typedRemote && (
                  <Button
                    size="sm"
                    onClick={() => void importFrom(typedRemote)}
                    disabled={disabled}
                  >
                    <Link2 />
                    Import {typedRemote.kind === "youtube" ? "transcript" : "article"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled}
                >
                  <FileUp />
                  .txt / .md
                </Button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.markdown,text/plain,text/markdown"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
