import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: string;
}

export function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  let resolvedVariant: BadgeVariant = variant || "default";

  if (status) {
    switch (status.toUpperCase()) {
      case "ACTIVE":
      case "PAID":
      case "SUCCESS":
      case "CLOSED":
        resolvedVariant = "success";
        break;
      case "OVERDUE":
      case "BLACKLISTED":
      case "DEFAULTED":
      case "REVERSED":
      case "FAILED":
        resolvedVariant = "danger";
        break;
      case "DUE_TODAY":
      case "PARTIAL":
      case "SUSPENDED":
        resolvedVariant = "warning";
        break;
      case "UPCOMING":
      case "PENDING_DISBURSAL":
      case "QUEUED":
        resolvedVariant = "info";
        break;
      case "INACTIVE":
      case "WAIVED":
        resolvedVariant = "secondary";
        break;
      default:
        resolvedVariant = "default";
    }
  }

  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10",
    warning: "bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10",
    danger: "bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/10",
    info: "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10",
    secondary: "bg-slate-100 text-slate-600 border-slate-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
  };

  const displayText = children || (status ? status.replace(/_/g, " ") : "");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}
