"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { Badge } from "@/lib/supabase/types";

type BadgePinProps = {
  badge: Badge & { learning: string; awarded_at: string };
  onClick: () => void;
};

export function BadgePin({ badge, onClick }: BadgePinProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Stable random rotation between -3 and 3 degrees based on badge id
  const rotation = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < badge.id.length; i++) {
      hash = badge.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return ((hash % 60) / 10) - 3; // range: -3 to ~3
  }, [badge.id]);

  const showPlaceholder = !badge.image_url || imgError;

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-card border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {badge.name}
          </div>
          <div className="w-2 h-2 bg-card border-b border-r border-border rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}

      {/* Badge circle with stitching */}
      <div className="badge-stitch p-1 transition-transform duration-200 group-hover:scale-110">
        {showPlaceholder ? (
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="text-accent font-bold text-lg md:text-xl">
              {badge.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <Image
            src={badge.image_url!}
            alt={badge.name}
            width={64}
            height={64}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
      </div>
    </div>
  );
}
