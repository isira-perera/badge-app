"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, BookOpen, Users } from "lucide-react";
import type { BadgeWithCount } from "./page";

export function BadgeCatalogSearch({ badges }: { badges: BadgeWithCount[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = badges.filter((badge) =>
    badge.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search badges by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Badge grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {searchQuery
              ? "No badges match your search."
              : "No badges yet. Be the first to create one!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((badge) => (
            <Link
              key={badge.id}
              href={`/badges/${badge.id}`}
              className="group p-4 bg-card border border-border rounded-lg hover:border-muted-foreground/30 hover:bg-secondary transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  {badge.image_url ? (
                    <Image
                      src={badge.image_url}
                      alt={badge.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <BookOpen className="w-7 h-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold group-hover:text-accent transition-colors truncate">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {badge.task}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {badge.earnerCount} earner
                      {badge.earnerCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
