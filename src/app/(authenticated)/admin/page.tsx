import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Users, BookOpen, Link as LinkIcon } from "lucide-react";
import { InviteSection } from "./invite-section";
import { UserManagement } from "./user-management";
import { BadgeManagement } from "./badge-management";

export default async function AdminPage() {
  const supabase = await createClient();

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!currentProfile?.is_admin) {
    redirect("/dashboard");
  }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all badges
  const { data: badges } = await supabase
    .from("badges")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all user_badges for counts
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("user_id, badge_id");

  // Count badges per user
  const userBadgeCounts: Record<string, number> = {};
  const badgeEarnerCounts: Record<string, number> = {};
  if (userBadges) {
    for (const ub of userBadges) {
      userBadgeCounts[ub.user_id] = (userBadgeCounts[ub.user_id] || 0) + 1;
      badgeEarnerCounts[ub.badge_id] =
        (badgeEarnerCounts[ub.badge_id] || 0) + 1;
    }
  }

  const profilesWithCounts = (profiles ?? []).map((p) => ({
    ...p,
    badgeCount: userBadgeCounts[p.id] || 0,
  }));

  const badgesWithCounts = (badges ?? []).map((b) => ({
    ...b,
    earnerCount: badgeEarnerCounts[b.id] || 0,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-accent" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, badges, and community settings.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-accent" />
            <div>
              <p className="text-2xl font-bold">{profilesWithCounts.length}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-accent" />
            <div>
              <p className="text-2xl font-bold">{badgesWithCounts.length}</p>
              <p className="text-xs text-muted-foreground">Total Badges</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-accent" />
            <div>
              <p className="text-2xl font-bold">{userBadges?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Link Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-accent" />
          Invite Link
        </h2>
        <InviteSection />
      </section>

      {/* User Management Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          User Management
        </h2>
        <UserManagement
          profiles={profilesWithCounts}
          currentUserId={user.id}
        />
      </section>

      {/* Badge Management Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-accent" />
          Badge Management
        </h2>
        <BadgeManagement badges={badgesWithCounts} />
      </section>
    </div>
  );
}
