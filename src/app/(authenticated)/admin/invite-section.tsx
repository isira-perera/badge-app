"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteSection() {
  const [copied, setCopied] = useState(false);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join`
      : "/join";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = joinUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-sm text-muted-foreground mb-3">
        Share this link to invite new members. They will sign in via magic link
        on this page.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-mono truncate">
          {joinUrl}
        </code>
        <button
          onClick={handleCopy}
          className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            copied
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground hover:opacity-90"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
