"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button
      size="sm"
      onClick={() => window.print()}
      className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-sm"
    >
      <Printer className="h-4 w-4" />
      <span>Print Receipt</span>
    </Button>
  );
}
