"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DreamButtonProps {
  peerId: string;
}

export default function DreamButton({ peerId }: DreamButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleClick() {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/honcho/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setStatus("success");
      setMessage("Dream scheduled");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3000);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Unknown error");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Triggering..." : "Trigger Dream"}
      </Button>
      {message && (
        <span
          className={`text-xs ${
            status === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
