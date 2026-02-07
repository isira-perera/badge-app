"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  Plus,
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { Badge } from "@/lib/supabase/types";

type Mode = "existing" | "new";

export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("existing");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Shared form state
  const [learning, setLearning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New badge form state
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeTask, setNewBadgeTask] = useState("");

  useEffect(() => {
    async function fetchBadges() {
      setLoadingBadges(true);
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("name");
      if (error) {
        setError("Failed to load badges.");
      } else {
        setBadges(data ?? []);
      }
      setLoadingBadges(false);
    }
    fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredBadges = badges.filter((badge) =>
    badge.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEarnExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadge) {
      setError("Please select a badge.");
      return;
    }
    if (!learning.trim()) {
      setError("Please describe what you learned.");
      return;
    }

    setSubmitting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("user_badges")
      .insert({
        user_id: user.id,
        badge_id: selectedBadge.id,
        learning: learning.trim(),
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSuccess("Badge earned! Redirecting to your dashboard...");
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const handleCreateAndEarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeName.trim()) {
      setError("Please enter a badge name.");
      return;
    }
    if (!newBadgeTask.trim()) {
      setError("Please describe the task.");
      return;
    }
    if (!learning.trim()) {
      setError("Please describe what you learned.");
      return;
    }

    setSubmitting(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setSubmitting(false);
      return;
    }

    // Create the badge
    const { data: newBadge, error: badgeError } = await supabase
      .from("badges")
      .insert({
        name: newBadgeName.trim(),
        task: newBadgeTask.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (badgeError || !newBadge) {
      setError(badgeError?.message ?? "Failed to create badge.");
      setSubmitting(false);
      return;
    }

    // Earn the badge
    const { error: earnError } = await supabase
      .from("user_badges")
      .insert({
        user_id: user.id,
        badge_id: newBadge.id,
        learning: learning.trim(),
      });

    if (earnError) {
      setError(earnError.message);
      setSubmitting(false);
      return;
    }

    // Kick off async badge image generation (fire-and-forget)
    fetch("/api/generate-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badgeName: newBadgeName.trim(),
        taskDescription: newBadgeTask.trim(),
        badgeId: newBadge.id,
      }),
    }).catch(() => {
      // Image generation is async; ignore errors here
    });

    setSuccess(
      "Badge created and earned! Your badge image is being generated. Redirecting..."
    );
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Earn a Badge</h1>
        <p className="text-muted-foreground mt-1">
          Pick an existing badge or create a brand new one.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-primary/20 border border-primary rounded-lg">
          <CheckCircle className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => {
            setMode("existing");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "existing"
              ? "bg-accent text-accent-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Earn Existing Badge
        </button>
        <button
          onClick={() => {
            setMode("new");
            setError("");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "new"
              ? "bg-accent text-accent-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <Plus className="w-4 h-4" />
          Create New Badge
        </button>
      </div>

      {/* ========== EXISTING BADGE MODE ========== */}
      {mode === "existing" && (
        <form onSubmit={handleEarnExisting}>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Badge grid */}
          {loadingBadges ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground text-sm">
                Loading badges...
              </span>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery
                  ? "No badges match your search."
                  : "No badges yet. Create the first one!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {filteredBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => setSelectedBadge(badge)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedBadge?.id === badge.id
                      ? "border-accent bg-card shadow-lg shadow-accent/10"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {badge.image_url ? (
                        <Image
                          src={badge.image_url}
                          alt={badge.name}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {badge.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {badge.task}
                      </p>
                    </div>
                  </div>
                  {selectedBadge?.id === badge.id && (
                    <div className="mt-3 flex items-center gap-1.5 text-accent text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Learning textarea */}
          {selectedBadge && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedBadge.image_url ? (
                    <Image
                      src={selectedBadge.image_url}
                      alt={selectedBadge.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedBadge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBadge.task}
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium mb-2">
                What did you learn?
              </label>
              <textarea
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                placeholder="Share what you learned from this experience..."
                required
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
              />

              <button
                type="submit"
                disabled={submitting || !learning.trim()}
                className="mt-4 w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Earning Badge...
                  </>
                ) : (
                  "Earn This Badge"
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* ========== NEW BADGE MODE ========== */}
      {mode === "new" && (
        <form onSubmit={handleCreateAndEarn}>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-5">
              {/* Badge name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Badge Name
                </label>
                <input
                  type="text"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  placeholder="e.g., First Campfire, Mountain Summit..."
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {/* Task description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Task - What do you do to earn this?
                </label>
                <textarea
                  value={newBadgeTask}
                  onChange={(e) => setNewBadgeTask(e.target.value)}
                  placeholder="Describe the activity or experience needed to earn this badge..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                />
              </div>

              {/* What did you learn */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  What did you learn?
                </label>
                <textarea
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                  placeholder="Share what you learned from this experience..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !newBadgeName.trim() ||
                !newBadgeTask.trim() ||
                !learning.trim()
              }
              className="mt-6 w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating & Earning Badge...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create & Earn Badge
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
