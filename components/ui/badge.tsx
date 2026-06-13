import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        neutral: "border-border bg-secondary text-secondary-foreground",
        primary: "border-transparent bg-primary/20 text-primary",
        urgent: "border-transparent bg-urgent/20 text-urgent",
        warn: "border-transparent bg-warn/20 text-warn",
        safe: "border-transparent bg-safe/20 text-safe",
        highlight: "border-transparent bg-highlight/30 text-highlight-foreground",
        outline: "border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
