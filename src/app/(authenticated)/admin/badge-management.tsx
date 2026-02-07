"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Loader2,
  Calendar,
  Users,
  BookOpen,
} from "lucide-react";
import type { Badge } from "@/lib/supabase/types";

type BadgeWithCount = Badge & { earnerCount: number };

export function BadgeManagement({ badges }: { badges: BadgeWithCount[] }) {
  const supabase = createClient();
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

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
                  <tr
                    key={badge.id}
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
                      <div className="flex items-center justify-end">
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
                  {confirmDelete === badge.id ? (
                    <div className="flex items-center gap-1 shrink-0">
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
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(badge.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
