"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Badge } from "@/lib/supabase/types";

type BadgeModalProps = {
  badge: Badge;
  earners: Array<{
    display_name: string;
    learning: string;
    awarded_at: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
};

export function BadgeModal({ badge, earners, isOpen, onClose }: BadgeModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative bg-card border border-border rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge image */}
        <div className="flex justify-center mb-6">
          <div className="badge-stitch p-2">
            {badge.image_url ? (
              <Image
                src={badge.image_url}
                alt={badge.name}
                width={200}
                height={200}
                className="w-[200px] h-[200px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[200px] h-[200px] rounded-full bg-primary flex items-center justify-center">
                <span className="text-accent font-bold text-6xl">
                  {badge.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Badge name */}
        <h2 className="text-2xl font-bold text-center mb-4 text-foreground">
          {badge.name}
        </h2>

        {/* Task */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
            How to earn
          </h3>
          <p className="text-muted-foreground leading-relaxed">{badge.task}</p>
        </div>

        {/* Earners / learnings */}
        {earners.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              Learnings
            </h3>
            <div className="space-y-3">
              {earners.map((earner, idx) => (
                <div
                  key={idx}
                  className="bg-secondary/50 rounded-lg p-4 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-foreground">
                      {earner.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(earner.awarded_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {earner.learning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
