"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      offset={20}
      toastOptions={{
        classNames: {
          toast: "!float !rounded-md !text-fg-0 !font-sans",
          title: "!text-sm !font-medium",
          description: "!text-fg-1",
          actionButton: "!bg-brand !text-brand-foreground !rounded-sm",
          cancelButton: "!bg-bg-3 !text-fg-0 !rounded-sm",
        },
      }}
      {...props}
    />
  );
}
