"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { scaleIn } from "@/components/motion/motion.config";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCopy } from "@/hooks/use-copy";

type Props = { text: string; label?: string } & Pick<ButtonProps, "size" | "variant">;

export function CopyButton({ text, label = "Copy", size = "sm", variant = "secondary" }: Props) {
  const { copied, copy } = useCopy();
  return (
    <Button
      size={size}
      variant={variant}
      onClick={async () => {
        if (!(await copy(text))) toast.error("Couldn't access the clipboard.");
      }}
    >
      <span className="relative size-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? "check" : "copy"}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={copied ? "absolute inset-0 text-success" : "absolute inset-0"}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </span>
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </Button>
  );
}
