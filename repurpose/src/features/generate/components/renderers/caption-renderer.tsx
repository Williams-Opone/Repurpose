"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { INSTAGRAM_MAX_CHARS } from "@/lib/constants";

import { CharRing } from "../editor/char-ring";
import { PlainEditor } from "../editor/plain-editor";

type Value = { body: string; hashtags: string[] };
type Props = {
  body: string | undefined;
  hashtags: ReadonlyArray<string | undefined> | undefined;
  streaming?: boolean;
  onChange?: (v: Value) => void;
};

export function CaptionRenderer({ body, hashtags, streaming, onChange }: Props) {
  const [draftTag, setDraftTag] = useState("");
  const b = body ?? "";
  const tags = (hashtags ?? []).filter((t): t is string => Boolean(t));

  function addTag() {
    const t = draftTag.replace(/^#+/, "").replace(/\s+/g, "").trim();
    if (!t || tags.includes(t) || !onChange) return;
    onChange({ body: b, hashtags: [...tags, t] });
    setDraftTag("");
  }

  return (
    <div className="flex flex-col gap-4">
      <PlainEditor
        value={b}
        ariaLabel="Caption"
        streaming={streaming}
        onChange={onChange ? (body) => onChange({ body, hashtags: tags }) : undefined}
      />
      {!streaming && <CharRing count={b.length} max={INSTAGRAM_MAX_CHARS} />}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 font-mono text-xs font-normal">
            #{t}
            {onChange && (
              <button
                type="button"
                aria-label={`Remove #${t}`}
                onClick={() => onChange({ body: b, hashtags: tags.filter((x) => x !== t) })}
              >
                <X className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {onChange && (
          <input
            value={draftTag}
            onChange={(e) => setDraftTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="+ hashtag"
            aria-label="Add hashtag"
            className="h-6 w-24 bg-transparent font-mono text-xs text-fg-1 placeholder:text-fg-2 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
