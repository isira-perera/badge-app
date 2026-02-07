"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldOff,
  Trash2,
  Loader2,
  Calendar,
  Trophy,
} from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

type ProfileWithCount = Profile & { badgeCount: number };

export function UserManagement({
  profiles,
  currentUserId,
}: {
  profiles: ProfileWithCount[];
  currentUserId: string;
}) {
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

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setLoadingAction(userId);
    setError("");

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !currentIsAdmin })
      .eq("id", userId);

    if (error) {
      setError(error.message);
    } else {
      router.refresh();
    }
    setLoadingAction(null);
  };

  const deleteUser = async (userId: string) => {
    setLoadingAction(userId);
    setError("");

    // Delete user's badges first
    await supabase.from("user_badges").delete().eq("user_id", userId);

    // Delete profile
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

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

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                Badges
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                Role
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">
                Joined
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const isCurrentUser = profile.id === currentUserId;
              return (
                <tr
                  key={profile.id}
                  className="border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {profile.display_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Trophy className="w-3.5 h-3.5" />
                      {profile.badgeCount}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {profile.is_admin ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Member
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {formatDate(profile.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    {!isCurrentUser && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            toggleAdmin(profile.id, profile.is_admin)
                          }
                          disabled={loadingAction === profile.id}
                          className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                          title={
                            profile.is_admin
                              ? "Remove admin"
                              : "Make admin"
                          }
                        >
                          {loadingAction === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : profile.is_admin ? (
                            <ShieldOff className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </button>

                        {confirmDelete === profile.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteUser(profile.id)}
                              disabled={loadingAction === profile.id}
                              className="px-2 py-1 text-xs bg-destructive text-white rounded hover:opacity-90 disabled:opacity-50"
                            >
                              {loadingAction === profile.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Confirm"
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
                            onClick={() => setConfirmDelete(profile.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Remove user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {profiles.map((profile) => {
          const isCurrentUser = profile.id === currentUserId;
          return (
            <div
              key={profile.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {profile.display_name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(profile.created_at)}
                    </p>
                  </div>
                </div>
                {profile.is_admin && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="w-3.5 h-3.5" />
                  {profile.badgeCount} badge
                  {profile.badgeCount !== 1 ? "s" : ""}
                </div>
                {!isCurrentUser && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggleAdmin(profile.id, profile.is_admin)
                      }
                      disabled={loadingAction === profile.id}
                      className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title={
                        profile.is_admin ? "Remove admin" : "Make admin"
                      }
                    >
                      {loadingAction === profile.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profile.is_admin ? (
                        <ShieldOff className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </button>

                    {confirmDelete === profile.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteUser(profile.id)}
                          disabled={loadingAction === profile.id}
                          className="px-2 py-1 text-xs bg-destructive text-white rounded hover:opacity-90 disabled:opacity-50"
                        >
                          Confirm
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
                        onClick={() => setConfirmDelete(profile.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
