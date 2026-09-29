import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        default: "bg-surface-2 text-muted",
        paper: "bg-paper text-ink",
        listed: "bg-ok/15 text-ok",
        hold: "bg-warn/15 text-warn",
        sold: "bg-danger/15 text-danger",
        grade: "bg-surface-2 text-fg",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
