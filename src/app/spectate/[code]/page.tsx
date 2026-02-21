import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, Eye } from "lucide-react";
import { SashBoard } from "@/components/SashBoard";
import { RecentActivity } from "@/components/RecentActivity";
import type {
  LeaderboardEntry,
  ActivityFeedItem,
  Badge,
} from "@/lib/supabase/types";

// Lazy-initialized service role client (same pattern as generate-badge API)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin)
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  return supabaseAdmin;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return {
    title: `Spectate | BadgeBoard`,
    description: `Viewing the BadgeBoard leaderboard (link: ${code})`,
  };
}

export default async function SpectatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = getSupabaseAdmin();

  // Validate the spectator link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: link, error } = await (supabase as any)
    .from("spectator_links")
    .select("id, code, label, expires_at")
    .eq("code", code)
    .single();

  if (error || !link) {
    notFound();
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <Eye className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
        <p className="text-muted-foreground mb-6">
          This spectator link is no longer active. Ask an admin for a new one.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-colors"
        >
          Go to BadgeBoard
        </Link>
      </div>
    );
  }

  // Fetch leaderboard (bypasses RLS via service role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaderboard } = await (supabase as any)
    .from("leaderboard")
    .select("*");

  // Fetch recent activity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activity } = await (supabase as any)
    .from("recent_activity")
    .select("*");

  // For each leaderboard entry, fetch their badges
  const entries = await Promise.all(
    (leaderboard as LeaderboardEntry[] | null)?.map(async (entry) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userBadges } = await (supabase as any)
        .from("user_badges")
        .select(
          `
          learning,
          awarded_at,
          badges (
            id,
            name,
            task,
            image_url,
            created_by,
            created_at
          )
        `
        )
        .eq("user_id", entry.id)
        .order("awarded_at", { ascending: false });

      const badges: Array<Badge & { learning: string; awarded_at: string }> =
        (userBadges ?? []).map((ub: Record<string, unknown>) => {
          const badgeData = ub.badges as Badge;
          return {
            ...badgeData,
            learning: ub.learning as string,
            awarded_at: ub.awarded_at as string,
          };
        });

      return { profile: entry, badges };
    }) ?? []
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-2xl font-bold">BadgeBoard</h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Eye className="w-3.5 h-3.5" />
              Spectator view{link.label ? ` — ${link.label}` : ""}
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm text-accent hover:underline"
        >
          Join BadgeBoard
        </Link>
      </div>

      <div className="space-y-10">
        {/* Sash Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">The Sash Board</h2>
            <div className="text-sm text-muted-foreground">
              {entries.length} {entries.length === 1 ? "intern" : "interns"}
            </div>
          </div>
          <SashBoard entries={entries} spectatorMode />
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <RecentActivity items={(activity as ActivityFeedItem[]) ?? []} />
        </section>
      </div>
    </div>
  );
}
