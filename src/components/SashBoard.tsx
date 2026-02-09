"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { BadgePin } from "@/components/BadgePin";
import { BadgeModal } from "@/components/BadgeModal";
import type { Badge, LeaderboardEntry } from "@/lib/supabase/types";

type SashEntry = {
  profile: LeaderboardEntry;
  badges: Array<Badge & { learning: string; awarded_at: string }>;
};

type SashBoardProps = {
  entries: SashEntry[];
};

export function SashBoard({ entries }: SashBoardProps) {
  const [selectedBadge, setSelectedBadge] = useState<
    (Badge & { learning: string; awarded_at: string }) | null
  >(null);
  const [modalEarners, setModalEarners] = useState<
    Array<{ display_name: string; learning: string; awarded_at: string }>
  >([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Sort by badge count descending
  const sorted = [...entries].sort(
    (a, b) => b.profile.badge_count - a.profile.badge_count
  );

  function handleBadgeClick(
    badge: Badge & { learning: string; awarded_at: string },
    entry: SashEntry
  ) {
    // Collect all earners of this badge across all entries
    const earners: Array<{
      display_name: string;
      learning: string;
      awarded_at: string;
    }> = [];

    for (const e of entries) {
      for (const b of e.badges) {
        if (b.id === badge.id) {
          earners.push({
            display_name: e.profile.display_name,
            learning: b.learning,
            awarded_at: b.awarded_at,
          });
        }
      }
    }

    setSelectedBadge(badge);
    setModalEarners(earners);
    setModalOpen(true);
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-40" />
        <p className="text-lg">No sashes yet.</p>
        <p className="text-sm mt-1">Be the first to earn a badge and start your sash!</p>
      </div>
    );
  }

  return (
    <>
      {/* Fluid horizontal sash layout — always horizontal, scrolls when needed */}
      <div className="overflow-hidden">
      <div className="flex flex-row items-end gap-2 md:gap-3 overflow-x-auto pb-4 md:px-2">
        {sorted.map((entry, index) => {
          const badgeCount = entry.profile.badge_count;

          return (
            <div
              key={entry.profile.id}
              className="flex flex-col items-center sash-item"
            >
              <Link href={`/profile/${entry.profile.id}`} className="flex flex-col items-center w-full">
                {/* Rank indicator for top 3 */}
                {index < 3 && (
                  <div
                    className={`text-[10px] md:text-xs font-bold mb-0.5 md:mb-1 px-1.5 md:px-2 py-0.5 rounded-full ${
                      index === 0
                        ? "bg-accent text-accent-foreground"
                        : index === 1
                        ? "bg-muted-foreground/30 text-foreground"
                        : "bg-[#8B5E3C]/30 text-[#d4a06a]"
                    }`}
                  >
                    #{index + 1}
                  </div>
                )}

                {/* Avatar */}
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary border border-accent/50 flex items-center justify-center overflow-hidden mb-0.5">
                  {entry.profile.avatar_url ? (
                    <Image
                      src={entry.profile.avatar_url}
                      alt={entry.profile.display_name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-accent font-bold text-xs md:text-sm">
                      {entry.profile.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="text-xs md:text-sm font-semibold text-foreground mb-0.5 text-center truncate w-full">
                  {entry.profile.display_name}
                </div>

                {/* Badge count */}
                <div className="text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2 flex items-center gap-0.5 md:gap-1">
                  <Trophy className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  {badgeCount} {badgeCount === 1 ? "badge" : "badges"}
                </div>
              </Link>

              {/* Sash strip */}
              <div
                className="relative w-full max-w-[var(--sash-max-strip)] rounded-b-2xl rounded-t-lg canvas-texture overflow-hidden flex flex-col items-center gap-2 md:gap-3 py-3 md:py-4 px-1.5 md:px-2"
                style={{
                  background: `linear-gradient(
                    180deg,
                    var(--primary) 0%,
                    #1e4a1e 40%,
                    #1a3d1a 100%
                  )`,
                  boxShadow: `
                    inset 2px 0 4px rgba(0,0,0,0.3),
                    inset -2px 0 4px rgba(0,0,0,0.3),
                    0 4px 12px rgba(0,0,0,0.4)
                  `,
                }}
              >
                {/* Top decorative bar */}
                <div className="w-full h-1 bg-accent/60 rounded-full mb-1" />

                {/* Badges on the sash */}
                {entry.badges.map((badge) => (
                  <BadgePin
                    key={badge.id}
                    badge={badge}
                    onClick={() => handleBadgeClick(badge, entry)}
                  />
                ))}

                {/* Bottom decorative bar */}
                <div className="mt-auto w-full h-1 bg-accent/30 rounded-full" />
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <BadgeModal
          badge={selectedBadge}
          earners={modalEarners}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedBadge(null);
          }}
        />
      )}
    </>
  );
}
