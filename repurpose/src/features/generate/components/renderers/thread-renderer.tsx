"use client";

import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

import { Button } from "@/components/ui/button";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { CharRing } from "../editor/char-ring";
import { PlainEditor } from "../editor/plain-editor";

type Props = {
  tweets: ReadonlyArray<string | undefined> | undefined;
  streaming?: boolean;
  onChange?: (tweets: string[]) => void;
};

function Rail({ last }: { last: boolean }) {
  return (
    <div className="flex w-5 shrink-0 flex-col items-center">
      <span className="mt-1.5 size-2 rounded-full border border-brand/60 bg-brand/20" />
      {!last && <span className="mt-1 w-px flex-1 bg-line" />}
    </div>
  );
}

function ReadThread({ tweets, streaming }: { tweets: string[]; streaming?: boolean }) {
  return (
    <ol className="flex flex-col gap-3">
      {tweets.map((t, i) => (
        <li key={i} className="flex gap-3">
          <Rail last={i === tweets.length - 1} />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-2">
            <PlainEditor
              value={t}
              ariaLabel={`Tweet ${i + 1}`}
              streaming={streaming && i === tweets.length - 1}
            />
            {!streaming && <CharRing count={t.length} max={TWEET_MAX_CHARS} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

type Row = { id: string; text: string };

function EditableTweet({
  row,
  index,
  last,
  onText,
  onRemove,
}: {
  row: Row;
  index: number;
  last: boolean;
  onText: (t: string) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="group flex gap-2"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => controls.start(e)}
        className="mt-1 cursor-grab touch-none text-fg-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <Rail last={last} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-2">
        <PlainEditor value={row.text} onChange={onText} ariaLabel={`Tweet ${index + 1}`} />
        <div className="flex items-center justify-between">
          <CharRing count={row.text.length} max={TWEET_MAX_CHARS} />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove tweet"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          >
            <X />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  );
}

function EditableThread({
  tweets,
  onChange,
}: {
  tweets: string[];
  onChange: (t: string[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    tweets.map((text) => ({ id: crypto.randomUUID(), text })),
  );

  function commit(next: Row[]) {
    setRows(next);
    onChange(next.map((r) => r.text));
  }

  return (
    <div className="flex flex-col gap-2">
      <Reorder.Group axis="y" values={rows} onReorder={commit} className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <EditableTweet
            key={row.id}
            row={row}
            index={i}
            last={i === rows.length - 1}
            onText={(text) => commit(rows.map((r) => (r.id === row.id ? { ...r, text } : r)))}
            onRemove={() => rows.length > 1 && commit(rows.filter((r) => r.id !== row.id))}
          />
        ))}
      </Reorder.Group>
      <Button
        size="sm"
        variant="ghost"
        className={cn("self-start")}
        onClick={() => commit([...rows, { id: crypto.randomUUID(), text: "" }])}
      >
        <Plus /> Add tweet
      </Button>
    </div>
  );
}

export function ThreadRenderer({ tweets, streaming, onChange }: Props) {
  const clean = (tweets ?? []).filter((t): t is string => typeof t === "string");
  if (onChange) return <EditableThread tweets={clean} onChange={onChange} />;
  return <ReadThread tweets={clean} streaming={streaming} />;
}
