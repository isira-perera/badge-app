"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, Trophy, BookOpen, PlusCircle, Settings, UserCircle, LogOut } from "lucide-react";

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
    { href: "/profile", label: "Profile", icon: UserCircle },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  return (
    <>
      {/* Desktop top nav — hidden on mobile */}
      <nav className="hidden sm:block border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
                <span>{label}</span>
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

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg min-w-[3.5rem] transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
                {isActive && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg min-w-[3.5rem] text-muted-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
