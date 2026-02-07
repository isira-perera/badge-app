"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Trophy, BookOpen, PlusCircle, Settings } from "lucide-react";

export function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const links = [
    { href: "/dashboard", label: "Sashes", icon: Trophy },
    { href: "/badges", label: "Badges", icon: BookOpen },
    { href: "/earn", label: "Earn", icon: PlusCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="w-6 h-6 text-accent" />
          <span>BadgeBoard</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="ml-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
