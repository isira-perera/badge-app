"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import type { Badge } from "@/lib/supabase/types";

type BadgePinProps = {
  badge: Badge & { learning: string; awarded_at: string };
  onClick: () => void;
};

export function BadgePin({ badge, onClick }: BadgePinProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [imgError, setImgError] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    <>
      {/* Tooltip — rendered via portal-style fixed positioning so it escapes overflow and rotation */}
      {showTooltip && tooltipRef.current && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltipRef.current.getBoundingClientRect().left + tooltipRef.current.offsetWidth / 2,
            top: tooltipRef.current.getBoundingClientRect().top - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-card border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {badge.name}
          </div>
          <div className="w-2 h-2 bg-card border-b border-r border-border rotate-45 mx-auto -mt-1" />
        </div>
      )}

      <div
        ref={tooltipRef}
        className="relative flex-shrink-0 cursor-pointer group"
        style={{ transform: `rotate(${rotation}deg)` }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
      >
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

        {/* Badge name label — scales down for longer names, wraps to 2 lines max */}
        <div className={`text-center leading-tight text-foreground/70 mt-0.5 max-w-[56px] md:max-w-[72px] mx-auto line-clamp-2 break-words ${
          badge.name.length > 12
            ? "text-[6px] md:text-[8px]"
            : badge.name.length > 8
            ? "text-[7px] md:text-[9px]"
            : "text-[8px] md:text-[10px]"
        }`}>
          {badge.name}
        </div>
      </div>
    </>
  );
}
