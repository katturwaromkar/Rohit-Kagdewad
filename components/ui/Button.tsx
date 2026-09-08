import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-md";

    const variantStyles = {
      primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:bg-slate-950",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200",
      outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm active:bg-red-800",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:bg-emerald-800",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
      link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
