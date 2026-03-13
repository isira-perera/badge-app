"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Trophy,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
  AlertCircle,
  BookOpen,
  Sparkles,
} from "lucide-react";
import type { Profile, Badge } from "@/lib/supabase/types";

type ProfileClientProps = {
  profile: Profile;
  badges: Array<Badge & { learning: string; awarded_at: string }>;
  email: string;
  isOwner?: boolean;
};

export function ProfileClient({ profile, badges, email, isOwner = true }: ProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.display_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);

  // Learning edit state
  const [badgeList, setBadgeList] = useState(badges);
  const [editingLearningBadge, setEditingLearningBadge] = useState<string | null>(null);
  const [learningInput, setLearningInput] = useState("");
  const [savingLearning, setSavingLearning] = useState(false);
  const [learningError, setLearningError] = useState("");

  // Avatar generation state
  const [showAvatarGen, setShowAvatarGen] = useState(false);
  const [avatarColor, setAvatarColor] = useState("");
  const [avatarSymbol, setAvatarSymbol] = useState("");
  const [avatarVibe, setAvatarVibe] = useState("");
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarError, setAvatarError] = useState("");

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Display name cannot be empty.");
      return;
    }
    if (trimmed === displayName) {
      setEditingName(false);
      return;
    }

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setDisplayName(trimmed);
    setEditingName(false);
    setSaving(false);
    router.refresh();
  };

  const handleCancelEdit = () => {
    setNameInput(displayName);
    setEditingName(false);
    setError("");
  };

  const handleEditLearning = (badge: (typeof badgeList)[0]) => {
    setEditingLearningBadge(badge.id);
    setLearningInput(badge.learning || "");
    setLearningError("");
  };

  const handleSaveLearning = async (badgeId: string) => {
    const trimmed = learningInput.trim();
    if (!trimmed) {
      setLearningError("Learning cannot be empty.");
      return;
    }

    setSavingLearning(true);
    setLearningError("");

    const { error: updateError } = await supabase
      .from("user_badges")
      .update({ learning: trimmed })
      .eq("user_id", profile.id)
      .eq("badge_id", badgeId);

    if (updateError) {
      setLearningError(updateError.message);
      setSavingLearning(false);
      return;
    }

    setBadgeList((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, learning: trimmed } : b))
    );
    setEditingLearningBadge(null);
    setSavingLearning(false);
    router.refresh();
  };

  const handleCancelLearning = () => {
    setEditingLearningBadge(null);
    setLearningInput("");
    setLearningError("");
  };

  const handleGenerateAvatar = async () => {
    setGeneratingAvatar(true);
    setAvatarError("");

    try {
      const res = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          color: avatarColor,
          symbol: avatarSymbol,
          vibe: avatarVibe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAvatarError(data.error || "Failed to generate avatar.");
        setGeneratingAvatar(false);
        return;
      }

      // Append cache-buster so the browser loads the new image
      setAvatarUrl(data.avatarUrl + "?t=" + Date.now());
      setShowAvatarGen(false);
      router.refresh();
    } catch {
      setAvatarError("Something went wrong. Please try again.");
    }

    setGeneratingAvatar(false);
  };

  const memberSince = new Date(profile.created_at).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary border-2 border-accent flex items-center justify-center shrink-0 overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-accent font-bold text-3xl sm:text-4xl">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => {
                  setShowAvatarGen(!showAvatarGen);
                  setAvatarError("");
                }}
                className="absolute -bottom-1 -right-1 p-1.5 bg-accent text-accent-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
                aria-label="Generate avatar"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left min-w-0 w-full">
            {/* Display Name */}
            {editingName ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                  maxLength={50}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2 justify-center sm:justify-start">
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    aria-label="Save"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition-colors"
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">
                  {displayName}
                </h1>
                {isOwner && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1.5 text-muted-foreground hover:text-accent transition-colors rounded-md hover:bg-secondary"
                    aria-label="Edit display name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Meta info */}
            <div className="mt-3 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-sm text-muted-foreground">
              {isOwner && email && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{email}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {memberSince}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-lg font-bold">{badgeList.length}</span>
                <span className="text-sm text-muted-foreground">
                  {badgeList.length === 1 ? "badge" : "badges"} received
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Generation Panel */}
        {isOwner && showAvatarGen && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Generate Your Avatar
            </h3>

            <div className="space-y-4">
              {/* Color theme */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  What colors or color theme?
                </label>
                <input
                  type="text"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  placeholder="e.g., ocean blue and silver, warm sunset tones, neon green..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  What symbol or image in the center?
                </label>
                <input
                  type="text"
                  value={avatarSymbol}
                  onChange={(e) => setAvatarSymbol(e.target.value)}
                  placeholder="e.g., a wolf howling at the moon, crossed swords, a phoenix..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {/* Vibe */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  What vibe or mood?
                </label>
                <input
                  type="text"
                  value={avatarVibe}
                  onChange={(e) => setAvatarVibe(e.target.value)}
                  placeholder="e.g., mysterious and dark, cheerful and bright, epic and heroic..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {/* Avatar error */}
              {avatarError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {avatarError}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerateAvatar}
                disabled={generatingAvatar || !avatarColor.trim() || !avatarSymbol.trim() || !avatarVibe.trim()}
                className="w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Avatar...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Avatar
                  </>
                )}
              </button>

              {generatingAvatar && (
                <p className="text-xs text-muted-foreground text-center">
                  This may take up to 15 seconds...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Received Badges
        </h2>

        {badgeList.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground">No badges received yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Someone needs to give them a badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badgeList.map((badge) => {
              const isExpanded = expandedBadge === badge.id;
              const isEditingLearning = editingLearningBadge === badge.id;
              const awardedDate = new Date(badge.awarded_at).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );

              return (
                <div
                  key={badge.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedBadge(isExpanded ? null : badge.id)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedBadge(isExpanded ? null : badge.id);
                    }
                  }}
                  className={`text-left w-full p-4 rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? "border-accent bg-card shadow-lg shadow-accent/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Badge image */}
                    <div className="w-14 h-14 rounded-full bg-primary border border-border flex items-center justify-center shrink-0 overflow-hidden badge-stitch">
                      {badge.image_url ? (
                        <Image
                          src={badge.image_url}
                          alt={badge.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-accent font-bold text-xl">
                          {badge.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Badge info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {awardedDate}
                      </p>
                    </div>
                  </div>

                  {/* Expanded: learning + task */}
                  {isExpanded && (
                    <div
                      className="mt-4 pt-3 border-t border-border space-y-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Task
                        </p>
                        <p className="text-sm">{badge.task}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            What I learned
                          </p>
                          {isOwner && !isEditingLearning && (
                            <button
                              onClick={() => handleEditLearning(badge)}
                              className="p-1 text-muted-foreground hover:text-accent transition-colors rounded-md hover:bg-secondary"
                              aria-label="Edit learning"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {isEditingLearning ? (
                          <div className="space-y-2">
                            <textarea
                              value={learningInput}
                              onChange={(e) => setLearningInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") handleCancelLearning();
                              }}
                              autoFocus
                              rows={3}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            {learningError && (
                              <div className="flex items-center gap-2 text-destructive text-xs">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {learningError}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveLearning(badge.id)}
                                disabled={savingLearning}
                                className="p-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                aria-label="Save learning"
                              >
                                {savingLearning ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelLearning}
                                className="p-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition-colors"
                                aria-label="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{badge.learning}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
