"use client";

import { useState } from "react";
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

  // Determine the maximum badge count for scaling sash heights
  const maxBadges = Math.max(...sorted.map((e) => e.profile.badge_count), 1);

  return (
    <>
      {/* Desktop: horizontal scroll. Mobile: vertical stack */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-3 overflow-x-auto pb-4 md:px-2">
        {sorted.map((entry, index) => {
          const badgeCount = entry.profile.badge_count;
          // Minimum height 200px, scales up with badges relative to max
          const sashMinHeight = 200;
          const sashMaxHeight = 600;
          const sashHeight =
            sashMinHeight +
            (badgeCount / maxBadges) * (sashMaxHeight - sashMinHeight);

          return (
            <div
              key={entry.profile.id}
              className="flex flex-col items-center flex-shrink-0 w-full md:w-auto"
            >
              {/* Rank indicator for top 3 */}
              {index < 3 && (
                <div
                  className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full ${
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

              {/* Name */}
              <div className="text-sm font-semibold text-foreground mb-0.5 text-center truncate max-w-[120px]">
                {entry.profile.display_name}
              </div>

              {/* Badge count */}
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {badgeCount} {badgeCount === 1 ? "badge" : "badges"}
              </div>

              {/* Sash strip */}
              <div
                className="relative w-[90px] md:w-[100px] rounded-b-2xl rounded-t-lg canvas-texture overflow-hidden flex flex-col items-center gap-3 py-4 px-2"
                style={{
                  minHeight: `${sashHeight}px`,
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
