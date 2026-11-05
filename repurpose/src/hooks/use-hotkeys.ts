"use client";

import { useEffect, useRef } from "react";

export type Hotkey = {
  key: string;
  /** ⌘ on Mac, Ctrl elsewhere. */
  mod?: boolean;
  shift?: boolean;
  /** Fire even when focus is inside an input/textarea. */
  allowInInputs?: boolean;
  handler: (e: KeyboardEvent) => void;
};

export function useHotkeys(hotkeys: Hotkey[]) {
  const ref = useRef(hotkeys);
  useEffect(() => {
    ref.current = hotkeys;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const inInput =
        !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      for (const h of ref.current) {
        const modOk = h.mod ? e.metaKey || e.ctrlKey : !(e.metaKey || e.ctrlKey);
        if (
          e.key.toLowerCase() === h.key.toLowerCase() &&
          modOk &&
          Boolean(h.shift) === e.shiftKey &&
          (h.allowInInputs || !inInput)
        ) {
          e.preventDefault();
          h.handler(e);
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
