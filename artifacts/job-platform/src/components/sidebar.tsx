import { Link, useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  FileText,
  CheckCircle,
  BarChart3,
  MessageSquare,
  Bell,
  ShieldAlert,
  Sun,
  Moon,
  FilePlus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
const isAdmin = profile?.role === "admin";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/jobs",          label: "Find Jobs",     icon: Briefcase },
  { href: "/tracker",       label: "Tracker",       icon: KanbanSquare },
  { href: "/resumes",       label: "Resumes",       icon: FileText },
  { href: "/ats",           label: "ATS Analyzer",  icon: CheckCircle },
  { href: "/ats-builder",   label: "ATS Builder",   icon: FilePlus },
  { href: "/analytics",     label: "Analytics",     icon: BarChart3 },
  { href: "/ai",            label: "AI Assistant",  icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function ProfileCompletionRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 100 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      className="absolute -inset-1.5 pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { data: profile } = useGetMyProfile();


const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = profile?.role === 'admin';

  // Profile completion — includes new extended fields
  const fields = [
    profile?.name || user?.fullName,
    userEmail,
    user?.imageUrl,
    profile?.title,
    profile?.location,
    (profile as any)?.phone,
    (profile as any)?.bio,
    (profile as any)?.dateOfBirth,
    (profile as any)?.gender,
    (profile as any)?.portfolio,
    profile?.experience,
    profile?.targetRole,
    profile?.linkedinUrl,
    profile?.githubUrl,
    (profile?.skills as string[] | undefined)?.length,
  ];
  const filled = fields.filter(Boolean).length;
  const completionPct = Math.round((filled / fields.length) * 100);

  const ringColor =
    completionPct >= 100 ? "#10b981" :
    completionPct >= 50  ? "#f59e0b" : "#ef4444";

  function handleNavClick() {
    onClose?.();
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen overflow-hidden">
      {/* Logo + close (mobile) */}
      <div className="px-6 py-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary tracking-tight">JobQuest</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin" onClick={handleNavClick}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium mt-2",
              location.startsWith("/admin")
                ? "bg-destructive/10 text-destructive"
                : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            )}>
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              Admin
            </div>
          </Link>
        )}
      </nav>

      {/* Bottom: user + completion */}
      <div className="p-4 border-t border-border space-y-3">
        <Link href="/profile" onClick={handleNavClick}>
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* Avatar with completion ring */}
            <div className="relative w-9 h-9 flex-shrink-0">
              <UserButton
                appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }}
              />
              <ProfileCompletionRing pct={completionPct} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                {user?.fullName || "Your Profile"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%`, backgroundColor: ringColor }}
                  />
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{completionPct}%</span>
              </div>
            </div>
          </div>
        </Link>

        <p className="text-xs text-center text-muted-foreground/50">
          All rights reserved © Vishnu
        </p>
      </div>
    </aside>
  );
}
