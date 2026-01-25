import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-soft-sm",
        destructive:
          "bg-destructive text-destructive-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5",
        outline:
          "bg-card border border-border rounded-2xl shadow-soft-sm hover:bg-muted hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground rounded-2xl shadow-soft-sm hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0.5",
        ghost: "hover:bg-muted hover:text-foreground rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        // Ceres Protocol specific variants - Flat colors only
        yes: "bg-yes text-yes-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5",
        no: "bg-no text-no-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5",
        yield:
          "bg-yield text-yield-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5",
        fire: "bg-primary text-primary-foreground rounded-2xl shadow-soft-lg hover:shadow-[0_8px_32px_-6px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:translate-y-0.5",
        pill: "bg-card text-card-foreground rounded-full shadow-soft-sm hover:shadow-soft hover:-translate-y-0.5 active:translate-y-0.5",
        teal: "bg-teal text-teal-foreground rounded-2xl shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
