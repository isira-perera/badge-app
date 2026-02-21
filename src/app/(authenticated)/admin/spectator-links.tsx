"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Copy, Check, Trash2, Plus, Eye } from "lucide-react";

type SpectatorLink = {
  id: string;
  code: string;
  label: string | null;
  expires_at: string | null;
  created_at: string;
};

type SpectatorLinksProps = {
  links: SpectatorLink[];
};

export function SpectatorLinks({ links: initialLinks }: SpectatorLinksProps) {
  const [links, setLinks] = useState(initialLinks);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  async function handleCreate() {
    setCreating(true);
    try {
      let expires_at: string | null = null;
      if (expiresIn === "1d") {
        expires_at = new Date(Date.now() + 86400000).toISOString();
      } else if (expiresIn === "7d") {
        expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
      } else if (expiresIn === "30d") {
        expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
      }

      const { data, error } = await supabase
        .from("spectator_links")
        .insert({
          label: label.trim() || null,
          expires_at,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([data as SpectatorLink, ...links]);
      setLabel("");
      setExpiresIn("never");
    } catch (err) {
      console.error("Failed to create spectator link:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("spectator_links")
      .delete()
      .eq("id", id);

    if (!error) {
      setLinks(links.filter((l) => l.id !== id));
    }
  }

  function getSpectateUrl(code: string) {
    return typeof window !== "undefined"
      ? `${window.location.origin}/spectate/${code}`
      : `/spectate/${code}`;
  }

  async function handleCopy(link: SpectatorLink) {
    try {
      await navigator.clipboard.writeText(getSpectateUrl(link.code));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = getSpectateUrl(link.code);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function isExpired(link: SpectatorLink) {
    return link.expires_at && new Date(link.expires_at) < new Date();
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-sm text-muted-foreground mb-4">
        Create shareable links that let anyone view the leaderboard without
        signing in. Spectators can see the sash board and recent activity, but
        cannot earn badges or interact.
      </p>

      {/* Create new link */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="text"
          placeholder="Label (optional, e.g. &quot;For managers&quot;)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
        />
        <select
          value={expiresIn}
          onChange={(e) => setExpiresIn(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
        >
          <option value="never">No expiry</option>
          <option value="1d">Expires in 1 day</option>
          <option value="7d">Expires in 7 days</option>
          <option value="30d">Expires in 30 days</option>
        </select>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Creating..." : "Create Link"}
        </button>
      </div>

      {/* Existing links */}
      {links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No spectator links yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const expired = isExpired(link);
            return (
              <div
                key={link.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
                  expired
                    ? "border-border/50 bg-background/50 opacity-60"
                    : "border-border bg-background"
                }`}
              >
                <code className="flex-1 text-xs font-mono truncate">
                  {getSpectateUrl(link.code)}
                </code>
                {link.label && (
                  <span className="hidden sm:inline text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded shrink-0">
                    {link.label}
                  </span>
                )}
                {expired ? (
                  <span className="text-xs text-red-400 shrink-0">
                    Expired
                  </span>
                ) : link.expires_at ? (
                  <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                    Expires{" "}
                    {new Date(link.expires_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="hidden sm:inline text-xs text-muted-foreground shrink-0">
                    No expiry
                  </span>
                )}
                <button
                  onClick={() => handleCopy(link)}
                  className="p-1.5 rounded hover:bg-surface transition-colors shrink-0"
                  title="Copy link"
                >
                  {copiedId === link.id ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1.5 rounded hover:bg-red-900/30 transition-colors shrink-0"
                  title="Delete link"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
