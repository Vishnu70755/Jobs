import { useGetJobStats, useGetAnalyticsOverview, useGetApplicationBoard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Zap, Wifi, Globe, Building2, TrendingUp, BarChart2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const STAT_CARDS = [
  { key: "totalJobs",    label: "Total Jobs",     icon: Briefcase,  color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { key: "newToday",     label: "New Today",      icon: Zap,        color: "text-yellow-500",  bg: "bg-yellow-500/10"  },
  { key: "remoteJobs",   label: "Remote Jobs",    icon: Wifi,       color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "hybridJobs",   label: "Hybrid Jobs",    icon: Globe,      color: "text-purple-500",  bg: "bg-purple-500/10"  },
  { key: "inOfficeJobs", label: "In-Office Jobs", icon: Building2,  color: "text-orange-500",  bg: "bg-orange-500/10"  },
] as const;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  saved:               { color: "bg-slate-400",   label: "Saved" },
  applied:             { color: "bg-blue-500",    label: "Applied" },
  under_review:        { color: "bg-yellow-500",  label: "Under Review" },
  pending:             { color: "bg-orange-500",  label: "Pending" },
  interview_scheduled: { color: "bg-purple-500",  label: "Interview" },
  in_process:          { color: "bg-indigo-500",  label: "In Process" },
  rejected:            { color: "bg-red-500",     label: "Rejected" },
  ghosted:             { color: "bg-gray-400",    label: "Ghosted" },
  offer_received:      { color: "bg-emerald-500", label: "Offer" },
  accepted:            { color: "bg-green-600",   label: "Accepted" },
  declined:            { color: "bg-rose-500",    label: "Declined" },
};

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useGetJobStats();
  const { data: overview, isLoading: loadingOverview } = useGetAnalyticsOverview();
  const { data: board, isLoading: loadingBoard } = useGetApplicationBoard();

  const totalApps = overview?.totalApplications ?? 0;
  const activeApps = board?.columns
    ?.filter(c => !["rejected", "declined", "ghosted", "accepted"].includes(c.status ?? ""))
    ?.reduce((sum, c) => sum + (c.count ?? 0), 0) ?? 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your job search command centre.</p>
      </div>

      {/* Job market stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Job Market</h2>
        {loadingStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
              <Card key={key} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                    <Icon className={cn("w-4.5 h-4.5", color)} style={{ width: "18px", height: "18px" }} />
                  </div>
                  <div>
                    <p className={cn("text-2xl font-bold", color)}>
                      {(stats as any)?.[key] ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Application stats */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Applications</h2>
        {loadingOverview ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <BarChart2 className="w-4.5 h-4.5 text-blue-500" style={{ width: "18px", height: "18px" }} />
                </div>
                <p className="text-2xl font-bold text-blue-500">{totalApps}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Applied</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-4.5 h-4.5 text-purple-500" style={{ width: "18px", height: "18px" }} />
                </div>
                <p className="text-2xl font-bold text-purple-500">{activeApps}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Active Pipeline</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" style={{ width: "18px", height: "18px" }} />
                </div>
                <p className="text-2xl font-bold text-emerald-500">{overview?.interviewRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Interview Rate</p>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-5">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-3">
                  <Zap className="w-4.5 h-4.5 text-yellow-500" style={{ width: "18px", height: "18px" }} />
                </div>
                <p className="text-2xl font-bold text-yellow-500">{overview?.offersReceived ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Offers Received</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Recent pipeline */}
      {!loadingBoard && board?.columns && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Snapshot</h2>
            <Link href="/tracker">
              <span className="text-sm text-primary hover:underline cursor-pointer">View all →</span>
            </Link>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {board.columns
                  .filter(col => (col.count ?? 0) > 0)
                  .map(col => {
                    const cfg = STATUS_CONFIG[col.status ?? ""] ?? { color: "bg-gray-400", label: col.label };
                    return (
                      <div key={col.status} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.color)} />
                        <span className="text-sm">{cfg.label}</span>
                        <Badge variant="secondary" className="text-xs font-mono">{col.count}</Badge>
                      </div>
                    );
                  })}
                {board.columns.every(c => !c.count) && (
                  <p className="text-sm text-muted-foreground">No applications tracked yet. <Link href="/tracker"><span className="text-primary hover:underline cursor-pointer">Start tracking →</span></Link></p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
