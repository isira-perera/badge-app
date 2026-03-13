"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  BookOpen,
  Loader2,
  Check,
  CheckCircle,
  AlertCircle,
  Gift,
  User,
} from "lucide-react";
import type { Badge, Profile } from "@/lib/supabase/types";

type Step = "recipient" | "badge" | "confirm";
type BadgeMode = "existing" | "new";

export default function GivePage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("recipient");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Step 1: Recipient
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);

  // Step 2: Badge
  const [badgeMode, setBadgeMode] = useState<BadgeMode>("existing");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeTask, setNewBadgeTask] = useState("");

  // Step 3: Learning + submit
  const [learning, setLearning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current user + profiles
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("display_name");
      // Exclude self
      setProfiles((data ?? []).filter((p) => p.id !== user.id));
      setLoadingProfiles(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch badges when entering badge step
  useEffect(() => {
    if (step !== "badge" || badges.length > 0) return;
    async function fetchBadges() {
      setLoadingBadges(true);
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("name");
      if (!error) setBadges(data ?? []);
      setLoadingBadges(false);
    }
    fetchBadges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const filteredProfiles = profiles.filter((p) =>
    p.display_name.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const filteredBadges = badges.filter((b) =>
    b.name.toLowerCase().includes(badgeSearch.toLowerCase())
  );

  const handleGiveExisting = async () => {
    if (!selectedRecipient || !selectedBadge || !learning.trim()) return;

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase
      .from("user_badges")
      .insert({
        user_id: selectedRecipient.id,
        badge_id: selectedBadge.id,
        given_by: currentUserId,
        learning: learning.trim(),
      });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? `${selectedRecipient.display_name} already has this badge!`
          : insertError.message
      );
      setSubmitting(false);
      return;
    }

    setSuccess(
      `Badge given to ${selectedRecipient.display_name}! Redirecting...`
    );
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const handleCreateAndGive = async () => {
    if (!selectedRecipient || !newBadgeName.trim() || !newBadgeTask.trim() || !learning.trim())
      return;

    setSubmitting(true);
    setError("");

    // Check for duplicate badge name
    const { data: existing } = await supabase
      .from("badges")
      .select("id")
      .eq("name", newBadgeName.trim())
      .maybeSingle();

    if (existing) {
      setError(
        `A badge called "${newBadgeName.trim()}" already exists. Switch to "Give Existing Badge" to use it.`
      );
      setSubmitting(false);
      return;
    }

    // Create the badge
    const { data: newBadge, error: badgeError } = await supabase
      .from("badges")
      .insert({
        name: newBadgeName.trim(),
        task: newBadgeTask.trim(),
        created_by: currentUserId,
      })
      .select()
      .single();

    if (badgeError || !newBadge) {
      setError(badgeError?.message ?? "Failed to create badge.");
      setSubmitting(false);
      return;
    }

    // Give the badge
    const { error: giveError } = await supabase
      .from("user_badges")
      .insert({
        user_id: selectedRecipient.id,
        badge_id: newBadge.id,
        given_by: currentUserId,
        learning: learning.trim(),
      });

    if (giveError) {
      setError(
        giveError.code === "23505"
          ? `${selectedRecipient.display_name} already has this badge!`
          : giveError.message
      );
      setSubmitting(false);
      return;
    }

    // Fire-and-forget image generation
    fetch("/api/generate-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badgeName: newBadgeName.trim(),
        taskDescription: newBadgeTask.trim(),
        badgeId: newBadge.id,
      }),
    }).catch(() => {});

    setSuccess(
      `Badge created and given to ${selectedRecipient.display_name}! Image is generating. Redirecting...`
    );
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (badgeMode === "existing") {
      handleGiveExisting();
    } else {
      handleCreateAndGive();
    }
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
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift className="w-8 h-8 text-accent" />
          Give a Badge
        </h1>
        <p className="text-muted-foreground mt-1">
          Recognize someone by giving them a badge for something they did.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([
          { key: "recipient" as const, label: "Pick Player" },
          { key: "badge" as const, label: "Choose Badge" },
          { key: "confirm" as const, label: "Add Learning" },
        ] as const).map((s, i) => {
          const stepOrder: Step[] = ["recipient", "badge", "confirm"];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = i;
          const isCompleted = thisIdx < currentIdx;
          const isCurrent = step === s.key;
          const hasBadgeData = badgeMode === "existing" ? !!selectedBadge : (!!newBadgeName.trim() && !!newBadgeTask.trim());
          const canNavigate =
            s.key === "recipient" ||
            (s.key === "badge" && !!selectedRecipient) ||
            (s.key === "confirm" && !!selectedRecipient && hasBadgeData);
          const isClickable = canNavigate && !isCurrent;

          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`w-8 h-px ${isCompleted ? "bg-accent/50" : "bg-border"}`} />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setStep(s.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : isCompleted
                    ? "bg-accent/20 border border-accent/40 text-accent cursor-pointer hover:bg-accent/30"
                    : isClickable
                    ? "bg-card border border-border text-muted-foreground cursor-pointer hover:border-accent/40 hover:text-foreground"
                    : "bg-card border border-border text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted ? "bg-accent/30" : "bg-background/20"
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {s.label}
              </button>
            </div>
          );
        })}
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

      {/* ========== STEP 1: PICK RECIPIENT ========== */}
      {step === "recipient" && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players..."
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {loadingProfiles ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground text-sm">
                Loading players...
              </span>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {profileSearch
                  ? "No players match your search."
                  : "No other players yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    const isFirstPick = !selectedRecipient;
                    setSelectedRecipient(profile);
                    setError("");
                    if (isFirstPick) setStep("badge");
                  }}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedRecipient?.id === profile.id
                      ? "border-accent bg-card shadow-lg shadow-accent/10"
                      : "border-border bg-card hover:border-muted-foreground/30 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary border border-accent/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.display_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-accent font-bold text-lg">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {profile.display_name}
                      </h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedRecipient && (
            <button
              type="button"
              onClick={() => setStep("badge")}
              className="mt-6 w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Next: Choose Badge
            </button>
          )}
        </div>
      )}

      {/* ========== STEP 2: CHOOSE BADGE ========== */}
      {step === "badge" && (
        <div>
          {/* Recipient summary */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary border border-accent/50 flex items-center justify-center shrink-0 overflow-hidden">
              {selectedRecipient?.avatar_url ? (
                <Image
                  src={selectedRecipient.avatar_url}
                  alt={selectedRecipient.display_name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-accent font-bold text-xs">
                  {selectedRecipient?.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm">
              Giving to{" "}
              <span className="font-semibold text-accent">
                {selectedRecipient?.display_name}
              </span>
            </p>
            <button
              onClick={() => setStep("recipient")}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setBadgeMode("existing");
                setError("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                badgeMode === "existing"
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Give Existing Badge
            </button>
            <button
              onClick={() => {
                setBadgeMode("new");
                setError("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                badgeMode === "new"
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Plus className="w-4 h-4" />
              Create New Badge
            </button>
          </div>

          {badgeMode === "existing" ? (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search badges..."
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
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
                    {badgeSearch
                      ? "No badges match your search."
                      : "No badges yet. Create the first one!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredBadges.map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => {
                        const isFirstPick = !selectedBadge;
                        setSelectedBadge(badge);
                        setError("");
                        if (isFirstPick) setStep("confirm");
                      }}
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
                    </button>
                  ))}
                </div>
              )}

              {selectedBadge && (
                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="mt-2 w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Next: Add Learning
                </button>
              )}
            </>
          ) : (
            /* New badge form */
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Badge Name
                  </label>
                  <input
                    type="text"
                    value={newBadgeName}
                    onChange={(e) => setNewBadgeName(e.target.value)}
                    placeholder="e.g., First Campfire, Mountain Summit..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Task - What did they do to earn this?
                  </label>
                  <textarea
                    value={newBadgeTask}
                    onChange={(e) => setNewBadgeTask(e.target.value)}
                    placeholder="Describe what they did to deserve this badge..."
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!newBadgeName.trim() || !newBadgeTask.trim()}
                onClick={() => {
                  setError("");
                  setStep("confirm");
                }}
                className="mt-6 w-full px-4 py-3 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Next: Add Learning
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== STEP 3: LEARNING + CONFIRM ========== */}
      {step === "confirm" && (
        <form onSubmit={handleSubmit}>
          {/* Summary */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary border border-accent/50 flex items-center justify-center shrink-0 overflow-hidden">
              {selectedRecipient?.avatar_url ? (
                <Image
                  src={selectedRecipient.avatar_url}
                  alt={selectedRecipient.display_name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-accent font-bold text-xs">
                  {selectedRecipient?.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm">
              Giving{" "}
              <span className="font-semibold text-accent">
                {badgeMode === "existing"
                  ? selectedBadge?.name
                  : newBadgeName.trim()}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-accent">
                {selectedRecipient?.display_name}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setStep("badge")}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Change
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            {/* Badge preview for existing */}
            {badgeMode === "existing" && selectedBadge && (
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
            )}

            <label className="block text-sm font-medium mb-2">
              What did they learn?
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              You listened — now share what {selectedRecipient?.display_name} took away from this experience.
            </p>
            <textarea
              value={learning}
              onChange={(e) => setLearning(e.target.value)}
              placeholder={`What did ${selectedRecipient?.display_name} learn from this experience?`}
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
                  Giving Badge...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Give This Badge
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
