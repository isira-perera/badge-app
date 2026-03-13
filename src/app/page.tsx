import Link from "next/link";
import { Shield, Trophy, Users, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-12 h-12 text-accent" />
          <h1 className="text-5xl font-bold tracking-tight">BadgeBoard</h1>
        </div>
        <p className="text-xl text-muted-foreground mb-12">
          Give badges. Share learnings. Level up together.
        </p>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-surface rounded-lg">
            <Trophy className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">1. Give Badges</h3>
            <p className="text-muted-foreground text-sm">
              Recognize your peers by giving them AI-generated badges for their experiences.
            </p>
          </div>
          <div className="text-center p-6 bg-surface rounded-lg">
            <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">2. Share Learnings</h3>
            <p className="text-muted-foreground text-sm">
              Listen to what your peers learned and capture it when you give them a badge.
            </p>
          </div>
          <div className="text-center p-6 bg-surface rounded-lg">
            <Users className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">3. Level Up</h3>
            <p className="text-muted-foreground text-sm">
              Climb the leaderboard as your badge sash grows. Who will reach the top?
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/join"
            className="px-8 py-3 border border-accent text-accent font-semibold rounded-lg hover:bg-surface-light transition-colors"
          >
            Join with Invite
          </Link>
        </div>
      </div>
    </div>
  );
}
