import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BookOpen, Calendar, Users, MessageSquare } from "lucide-react";

export default async function BadgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the badge
  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("*")
    .eq("id", id)
    .single();

  if (badgeError || !badge) {
    notFound();
  }

  // Fetch all user_badges for this badge, joined with profiles
  const { data: earners } = await supabase
    .from("user_badges")
    .select("id, user_id, learning, awarded_at")
    .eq("badge_id", id)
    .order("awarded_at", { ascending: false });

  // Fetch profile info for earners
  const earnerUserIds = (earners ?? []).map((e) => e.user_id);
  const { data: profiles } = earnerUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", earnerUserIds)
    : { data: [] };

  const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (profiles) {
    for (const p of profiles) {
      profileMap[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Back link */}
      <Link
        href="/badges"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Badge Catalog
      </Link>

      {/* Badge hero */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center shrink-0 overflow-hidden">
            {badge.image_url ? (
              <Image
                src={badge.image_url}
                alt={badge.name}
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">{badge.name}</h1>
            <p className="text-muted-foreground mb-4">{badge.task}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(badge.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>
                  {earners?.length ?? 0} earner
                  {(earners?.length ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earners list */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Learnings
        </h2>

        {!earners || earners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No one has received this badge yet. Be the first to give it!</p>
            <Link
              href="/give"
              className="inline-block mt-4 text-sm text-accent hover:underline"
            >
              Give this badge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {earners.map((earner) => {
              const profile = profileMap[earner.user_id];
              return (
                <div
                  key={earner.id}
                  className="bg-card border border-border rounded-lg p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {profile?.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.display_name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {(profile?.display_name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {profile?.display_name ?? "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(earner.awarded_at)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {earner.learning}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
