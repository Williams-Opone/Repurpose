import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none",
    "transition-[color,background-color,border-color,transform]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "raised bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "raised border border-line bg-bg-2 text-fg-0 hover:border-line-strong hover:bg-bg-3",
        outline: "border border-line-strong bg-transparent text-fg-0 hover:bg-bg-2",
        ghost: "text-fg-1 hover:bg-bg-2 hover:text-fg-0",
        destructive: "border border-danger/20 bg-danger/10 text-danger hover:bg-danger/15",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-11 px-5 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8 rounded-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
