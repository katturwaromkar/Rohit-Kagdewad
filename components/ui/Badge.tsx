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
      case "DELIVERED":
      case "READ":
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
      case "SENT":
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
    default: "bg-slate-800 text-slate-200 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    secondary: "bg-slate-800/80 text-slate-300 border-slate-700/60",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  const displayText = children || (status ? formatStatusLabel(status) : "");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide select-none font-mono",
        variantStyles[resolvedVariant],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      <span>{displayText}</span>
    </span>
  );
}

function formatStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "Active (सुरू)";
    case "OVERDUE":
      return "Overdue (थकीत)";
    case "PAID":
    case "CLOSED":
      return "Closed (पूर्ण)";
    case "DUE_TODAY":
      return "Due Today (आज देय)";
    case "PARTIAL":
      return "Partial (अंशतः)";
    case "UPCOMING":
      return "Upcoming (पुढील)";
    case "SENT":
      return "Sent";
    case "DELIVERED":
      return "Delivered";
    case "READ":
      return "Read";
    case "FAILED":
      return "Failed";
    default:
      return status.replace(/_/g, " ");
  }
}
