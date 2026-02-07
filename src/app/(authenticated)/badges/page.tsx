import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, PlusCircle, Users } from "lucide-react";
import { BadgeCatalogSearch } from "./badge-catalog-search";
import type { Badge } from "@/lib/supabase/types";

export type BadgeWithCount = Badge & { earnerCount: number };

export default async function BadgesCatalogPage() {
  const supabase = await createClient();

  // Fetch all badges
  const { data: badges } = await supabase
    .from("badges")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch all user_badges and group by badge_id
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id");

  // Count earners per badge
  const earnerCounts: Record<string, number> = {};
  if (userBadges) {
    for (const ub of userBadges) {
      earnerCounts[ub.badge_id] = (earnerCounts[ub.badge_id] || 0) + 1;
    }
  }

  const badgesWithCounts: BadgeWithCount[] = (badges ?? []).map((badge) => ({
    ...badge,
    earnerCount: earnerCounts[badge.id] || 0,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Badge Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse all {badgesWithCounts.length} badge
            {badgesWithCounts.length !== 1 ? "s" : ""} in the community.
          </p>
        </div>
        <Link
          href="/earn"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Earn a Badge
        </Link>
      </div>

      {/* Client-side search + grid */}
      <BadgeCatalogSearch badges={badgesWithCounts} />
    </div>
  );
}
