import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SashBoard } from "@/components/SashBoard";
import { RecentActivity } from "@/components/RecentActivity";
import type {
  LeaderboardEntry,
  ActivityFeedItem,
  Badge,
} from "@/lib/supabase/types";

export const metadata = {
  title: "Dashboard | BadgeBoard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Double-check auth (middleware should handle, but belt-and-suspenders)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch leaderboard
  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*");

  // Fetch recent activity
  const { data: activity } = await supabase
    .from("recent_activity")
    .select("*");

  // For each leaderboard entry, fetch their badges with badge details
  const entries = await Promise.all(
    (leaderboard as LeaderboardEntry[] | null)?.map(async (entry) => {
      const { data: userBadges } = await supabase
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

      // Flatten the joined data
      const badges: Array<Badge & { learning: string; awarded_at: string }> =
        (userBadges ?? []).map((ub: Record<string, unknown>) => {
          const badgeData = ub.badges as Badge;
          return {
            ...badgeData,
            learning: ub.learning as string,
            awarded_at: ub.awarded_at as string,
          };
        });

      return {
        profile: entry,
        badges,
      };
    }) ?? []
  );

  return (
    <div className="space-y-10">
      {/* Sash Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">The Sash Board</h2>
          <div className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "scout" : "scouts"}
          </div>
        </div>
        <SashBoard entries={entries} />
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <RecentActivity items={(activity as ActivityFeedItem[]) ?? []} />
      </section>
    </div>
  );
}
