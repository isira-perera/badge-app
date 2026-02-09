import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";
import type { Profile, Badge } from "@/lib/supabase/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .single();

  return {
    title: profile ? `${profile.display_name} | BadgeBoard` : "Profile | BadgeBoard",
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Check if the logged-in user is viewing their own profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // If viewing own profile, redirect to canonical /profile URL
  if (user.id === id) {
    redirect("/profile");
  }

  // Fetch the target user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch the target user's earned badges
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
    .eq("user_id", id)
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
      email=""
      isOwner={false}
    />
  );
}
