"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function JoinPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-surface rounded-lg p-8 text-center">
          <Mail className="w-16 h-16 text-accent mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Check your email!</h2>
          <p className="text-muted mb-6">
            We sent a magic link to <span className="text-accent font-medium">{email}</span>.
            Click the link to join BadgeBoard.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-surface rounded-lg p-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-bold">Join BadgeBoard</h1>
        </div>
        <p className="text-muted mb-8">
          Enter your email to join the community and start earning badges.
        </p>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 bg-surface-light border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder:text-muted"
          />
          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Sending..." : "Join"}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
