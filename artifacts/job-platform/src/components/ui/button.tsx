import React from "react";
 
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-[hsl(var(--background))] transition-all duration-200 ease-out-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:scale-[1] disabled:active:scale-[1] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-t from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-600 active:to-emerald-700 shadow-sm hover:shadow-md transition-shadow duration-200",
        destructive: "bg-gradient-to-t from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 shadow-sm hover:shadow-md transition-shadow duration-200 border border-transparent",
        outline: "border-[var(--button-outline)] bg-background hover:bg-[var(--background)] hover:bg-opacity-5 hover:shadow-sm transition-all duration-200 ease-out-[cubic-bezier(0.16,1,0.3,1)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 border border-secondary-hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:bg-opacity-10 hover:shadow-sm transition-all duration-200 ease-out-[cubic-bezier(0.16,1,0.3,1)]",
        link: "text-primary underline-offset-4 hover:underline hover:no-underline-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-6 py-3",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
