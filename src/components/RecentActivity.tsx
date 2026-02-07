"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import type { ActivityFeedItem } from "@/lib/supabase/types";

type RecentActivityProps = {
  items: ActivityFeedItem[];
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="bg-card border border-border/50 rounded-xl p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        {/* Badge thumbnail */}
        <div className="flex-shrink-0">
          {item.badge_image_url && !imgError ? (
            <Image
              src={item.badge_image_url}
              alt={item.badge_name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border-2 border-border"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-border">
              <Award className="w-5 h-5 text-accent" />
            </div>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-foreground">
              {item.display_name}
            </span>{" "}
            <span className="text-muted-foreground">earned</span>{" "}
            <span className="font-semibold text-accent">
              {item.badge_name}
            </span>
          </p>
        </div>

        {/* Time + expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {relativeTime(item.awarded_at)}
          </span>
          {item.learning && (
            expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )
          )}
        </div>
      </div>

      {/* Expanded learning */}
      {expanded && item.learning && (
        <div className="mt-3 pl-13 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3 ml-[52px]">
          &ldquo;{item.learning}&rdquo;
        </div>
      )}
    </div>
  );
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activity yet. Be the first to earn a badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  );
}
