"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Gift } from "lucide-react";
import { BadgePin } from "@/components/BadgePin";
import { BadgeModal } from "@/components/BadgeModal";
import type { Badge, LeaderboardEntry } from "@/lib/supabase/types";

type SashEntry = {
  profile: LeaderboardEntry;
  badges: Array<Badge & { learning: string; awarded_at: string }>;
};

type SashBoardProps = {
  entries: SashEntry[];
  spectatorMode?: boolean;
  topGiverId?: string | null;
};

export function SashBoard({ entries, spectatorMode = false, topGiverId }: SashBoardProps) {
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
    _entry: SashEntry
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
        <p className="text-sm mt-1">Give someone a badge to start their sash!</p>
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
          const isTopGiver = topGiverId === entry.profile.id;

          return (
            <div
              key={entry.profile.id}
              className={`flex flex-col items-center sash-item ${isTopGiver ? "top-giver" : ""}`}
            >
              {(() => {
                const profileContent = (
                  <>
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
                    {isTopGiver && (
                      <div className="text-[9px] md:text-[10px] font-bold text-accent mb-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30">
                        <Gift className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        Top Giver
                      </div>
                    )}
                  </>
                );

                return spectatorMode ? (
                  <div className="flex flex-col items-center w-full">
                    {profileContent}
                  </div>
                ) : (
                  <Link href={`/profile/${entry.profile.id}`} className="flex flex-col items-center w-full">
                    {profileContent}
                  </Link>
                );
              })()}

              {/* Sash strip */}
              <div
                className={`relative w-full max-w-[var(--sash-max-strip)] rounded-b-2xl rounded-t-lg canvas-texture overflow-hidden flex flex-col items-center gap-2 md:gap-3 py-3 md:py-4 px-1.5 md:px-2 ${isTopGiver ? "top-giver-glow" : ""}`}
                style={{
                  background: `linear-gradient(
                    180deg,
                    var(--primary) 0%,
                    #1e4a1e 40%,
                    #1a3d1a 100%
                  )`,
                  boxShadow: isTopGiver
                    ? `
                    inset 2px 0 4px rgba(0,0,0,0.3),
                    inset -2px 0 4px rgba(0,0,0,0.3),
                    0 0 20px rgba(212,168,67,0.4),
                    0 0 40px rgba(212,168,67,0.2),
                    0 4px 12px rgba(0,0,0,0.4)
                  `
                    : `
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
