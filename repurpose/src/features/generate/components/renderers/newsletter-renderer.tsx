"use client";

import { NEWSLETTER_SUBJECT_MAX_CHARS } from "@/lib/constants";

import { CharRing } from "../editor/char-ring";
import { PlainEditor } from "../editor/plain-editor";

type Value = { subject: string; body: string };
type Props = {
  subject: string | undefined;
  body: string | undefined;
  streaming?: boolean;
  onChange?: (v: Value) => void;
};

export function NewsletterRenderer({ subject, body, streaming, onChange }: Props) {
  const s = subject ?? "";
  const b = body ?? "";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 border-b border-line pb-3">
        <span className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">Subject</span>
        <PlainEditor
          value={s}
          singleLine
          ariaLabel="Subject line"
          className="font-medium"
          streaming={streaming && !b}
          onChange={onChange ? (subject) => onChange({ subject, body: b }) : undefined}
        />
        {!streaming && <CharRing count={s.length} max={NEWSLETTER_SUBJECT_MAX_CHARS} />}
      </div>
      <PlainEditor
        value={b}
        ariaLabel="Newsletter body"
        streaming={streaming && Boolean(b)}
        onChange={onChange ? (body) => onChange({ subject: s, body }) : undefined}
      />
      {onChange && <p className="text-xs text-fg-2">Markdown: **bold**, lists.</p>}
    </div>
  );
}
