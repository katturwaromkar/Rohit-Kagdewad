"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") {
          new Notification("Rohit Lending Notifications Active", {
            body: "You will receive instant alerts on payment collections and loan updates.",
            icon: "/icon-192.png",
          });
        }
      } catch (err) {
        console.error("Error requesting notification permission:", err);
      }
    }
  };

  if (permission === "granted" || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-18 sm:bottom-6 right-4 sm:right-6 max-w-sm w-[calc(100%-2rem)] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 z-50 text-xs text-white animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Enable Mobile Alerts (सूचना)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Receive real-time notifications on daily collections and due dates.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-md"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
        <Button
          size="sm"
          onClick={requestPermission}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 text-xs"
        >
          Enable Alerts (सुरू करा)
        </Button>
      </div>
    </div>
  );
}
