import { Link, useLocation } from "wouter";
import { UserButton, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  Briefcase, 
  KanbanSquare, 
  FileText, 
  CheckCircle, 
  BarChart3, 
  MessageSquare, 
  Bell, 
  Settings,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Find Jobs", icon: Briefcase },
  { href: "/tracker", label: "Tracker", icon: KanbanSquare },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/ats", label: "ATS Analyzer", icon: CheckCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai", label: "AI Assistant", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen overflow-hidden sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary tracking-tight">JobQuest</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}

        {isAdmin && (
          <Link href="/admin">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium mt-4",
              location.startsWith("/admin") 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <ShieldAlert className="w-4 h-4" />
              Admin
            </div>
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.fullName || "User"}</p>
            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate block">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
