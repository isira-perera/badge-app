import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";
import type { Profile, Badge } from "@/lib/supabase/types";

export const metadata = {
  title: "Profile | BadgeBoard",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch the user's earned badges with badge details
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
    .eq("user_id", user.id)
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

  return (
    <ProfileClient
      profile={profile as Profile}
      badges={badges}
      email={user.email ?? ""}
      isOwner={true}
    />
  );
}
