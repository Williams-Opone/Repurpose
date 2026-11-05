"use client";

import { CharRing } from "../editor/char-ring";
import { PlainEditor } from "../editor/plain-editor";

type Props = {
  body: string | undefined;
  max: number;
  streaming?: boolean;
  onChange?: (body: string) => void;
  hint?: string;
};

export function PostRenderer({ body, max, streaming, onChange, hint }: Props) {
  const text = body ?? "";
  return (
    <div className="flex flex-col gap-3">
      {hint && <p className="font-mono text-[11px] tracking-wider text-fg-2 uppercase">{hint}</p>}
      <PlainEditor value={text} onChange={onChange} streaming={streaming} ariaLabel="Post body" />
      {!streaming && <CharRing count={text.length} max={max} />}
    </div>
  );
}
