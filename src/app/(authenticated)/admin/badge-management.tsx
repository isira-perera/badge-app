"use client";

import React, { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Loader2,
  Calendar,
  Users,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import type { Badge } from "@/lib/supabase/types";

type BadgeWithCount = Badge & { earnerCount: number };

export function BadgeManagement({ badges }: { badges: BadgeWithCount[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Regenerate image state
  const [regenBadgeId, setRegenBadgeId] = useState<string | null>(null);
  const [adminComments, setAdminComments] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const deleteBadge = async (badgeId: string) => {
    setLoadingAction(badgeId);
    setError("");

    // Delete associated user_badges first
    await supabase.from("user_badges").delete().eq("badge_id", badgeId);

    // Delete the badge
    const { error } = await supabase
      .from("badges")
      .delete()
      .eq("id", badgeId);

    if (error) {
      setError(error.message);
    } else {
      setConfirmDelete(null);
      router.refresh();
    }
    setLoadingAction(null);
  };

  const regenerateImage = async (badge: BadgeWithCount) => {
    setRegenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeId: badge.id,
          badgeName: badge.name,
          taskDescription: badge.task,
          adminComments: adminComments.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to regenerate badge image.");
      } else {
        setRegenBadgeId(null);
        setAdminComments("");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setRegenerating(false);
  };

  return (
    <div>
      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      {badges.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No badges created yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Badge
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Task
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Earners
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                    Created
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {badges.map((badge) => (
                  <React.Fragment key={badge.id}>
                  <tr
                    className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium">{badge.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                        {badge.task}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {badge.earnerCount}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {formatDate(badge.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setRegenBadgeId(regenBadgeId === badge.id ? null : badge.id);
                            setAdminComments("");
                            setError("");
                          }}
                          className="p-1.5 rounded hover:bg-accent/10 transition-colors text-muted-foreground hover:text-accent"
                          title="Regenerate image"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {confirmDelete === badge.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteBadge(badge.id)}
                              disabled={loadingAction === badge.id}
                              className="px-2 py-1 text-xs bg-destructive text-white rounded hover:opacity-90 disabled:opacity-50"
                            >
                              {loadingAction === badge.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(badge.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Delete badge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Regenerate image panel (desktop) */}
                  {regenBadgeId === badge.id && (
                    <tr className="border-b border-border last:border-b-0">
                      <td colSpan={5} className="px-5 py-4 bg-secondary/30">
                        <div className="flex items-start gap-4">
                          {/* Current badge image preview */}
                          <div className="w-14 h-14 rounded-full bg-primary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                            {badge.image_url ? (
                              <Image
                                src={badge.image_url + "?t=" + Date.now()}
                                alt={badge.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-accent font-bold text-lg">
                                {badge.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                              Additional directions for image generation (optional)
                            </label>
                            <textarea
                              value={adminComments}
                              onChange={(e) => setAdminComments(e.target.value)}
                              placeholder="e.g., Use blue tones, include a laptop icon, make it more minimalist..."
                              rows={2}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => regenerateImage(badge)}
                                disabled={regenerating}
                                className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {regenerating ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3" />
                                    Regenerate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setRegenBadgeId(null);
                                  setAdminComments("");
                                }}
                                disabled={regenerating}
                                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              {regenerating && (
                                <span className="text-xs text-muted-foreground">
                                  This may take up to 15 seconds...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium">{badge.name}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setRegenBadgeId(regenBadgeId === badge.id ? null : badge.id);
                        setAdminComments("");
                        setError("");
                      }}
                      className="p-1.5 rounded hover:bg-accent/10 transition-colors text-muted-foreground hover:text-accent"
                      title="Regenerate image"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    {confirmDelete === badge.id ? (
                      <>
                        <button
                          onClick={() => deleteBadge(badge.id)}
                          disabled={loadingAction === badge.id}
                          className="px-2 py-1 text-xs bg-destructive text-white rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-xs text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(badge.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {badge.task}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {badge.earnerCount} earner
                    {badge.earnerCount !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(badge.created_at)}
                  </div>
                </div>

                {/* Regenerate image panel (mobile) */}
                {regenBadgeId === badge.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {badge.image_url ? (
                          <Image
                            src={badge.image_url + "?t=" + Date.now()}
                            alt={badge.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-accent font-bold text-sm">
                            {badge.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Current image</span>
                    </div>
                    <textarea
                      value={adminComments}
                      onChange={(e) => setAdminComments(e.target.value)}
                      placeholder="Additional directions (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => regenerateImage(badge)}
                        disabled={regenerating}
                        className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {regenerating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            Regenerate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setRegenBadgeId(null);
                          setAdminComments("");
                        }}
                        disabled={regenerating}
                        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                    {regenerating && (
                      <p className="text-xs text-muted-foreground mt-2">
                        This may take up to 15 seconds...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
