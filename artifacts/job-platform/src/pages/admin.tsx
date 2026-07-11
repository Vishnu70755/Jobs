import { useState, useEffect } from "react";
import { useUser } from "@clerk/react";
import { useLocation, Link } from "wouter";
import {
  useGetAdminStats,
  useListAdminUsers,
  useSuspendUser,
  getListAdminUsersQueryKey,
  useGetMyProfile
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Briefcase, FileText, BarChart2, TrendingUp, ShieldAlert, Search, UserX, Lock, Loader2, Save,
} from "lucide-react";
import { useImportStatusQuery, useImportStatsQuery, useStartImportMutation, useStopImportMutation, ImportStatus, ImportStats } from "@/hooks/useImportControl";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Helper function to format dates in IST (Indian Standard Time)
function formatIST(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

// Helper function to get next 7:00 AM IST
function getNext7amIST(): Date {
  const now = new Date();
  const nowInIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  let next7am = new Date(nowInIST);
  next7am.setHours(7, 0, 0, 0); // Set to 7:00:00.000

  // If it's already past 7 AM today, schedule for tomorrow
  if (nowInIST.getHours() > 7 || (nowInIST.getHours() === 7 && nowInIST.getMinutes() > 0)) {
    next7am.setDate(next7am.getDate() + 1);
  }

  // Convert back to local time for display/storage
  return new Date(next7am.toLocaleString("en-US", { timeZone: "UTC" }));
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-primary mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AccessDenied() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          setLocation("/sign-in");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [setLocation]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-8">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <Lock className="w-10 h-10 text-destructive" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-destructive">Admin Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          This page is restricted to the platform administrator only. You do not have permission to view this page.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Redirecting to Sign In in {countdown}s…
      </div>
      <Button onClick={() => setLocation("/sign-in")} className="gap-2">
        Sign In Now
      </Button>
    </div>
  );
}

export default function Admin() {
  const { user, isLoaded } = useUser();
  const { data: stats, isLoading: loadingStats } = useGetAdminStats({
    query: {},
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: usersData, isLoading: loadingUsers } = useListAdminUsers(
    { search: search || undefined, page },
    { query: {} }
  );
  const suspendUser = useSuspendUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Import control hooks
  const { data: importStatus, isLoading: loadingImportStatus } = useImportStatusQuery();
  const { data: importStats, isLoading: loadingImportStats } = useImportStatsQuery();
  const startImportMutation = useStartImportMutation();
  const stopImportMutation = useStopImportMutation();

  // Get user profile to check role
  const { data: profile, isLoading: loadingProfile } = useGetMyProfile();

  // Check if user is admin based on role from our backend
  const isAdmin = profile?.role === 'admin';

  // Compute import status values from the array (handle undefined/empty cases safely)
  const isAnyImportRunning = Array.isArray(importStatus)
    ? importStatus.some(status => status.isRunning)
    : false;

  const mostRecentLastRun = Array.isArray(importStatus) && importStatus.length > 0
    ? importStatus
        .map(status => status.lastRun ? new Date(status.lastRun) : null)
        .filter((date): date is Date => date !== null)
        .reduce((latest, date) => (date > latest ? date : latest), new Date(0))
    : null;

  const soonestNextRun = Array.isArray(importStatus) && importStatus.length > 0
    ? importStatus
        .map(status => status.nextScheduledRun ? new Date(status.nextScheduledRun) : null)
        .filter((date): date is Date => date !== null)
        .reduce((soonest, date) => (date < soonest ? date : soonest), new Date(8640000000000000))
    : null;

  // Calculate how many times import started today
  const importsStartedToday = Array.isArray(importStatus)
    ? importStatus.reduce((count, status) => {
        // Count imports that started today (based on lastRunAt)
        if (status.lastRunAt) {
          const lastRun = new Date(status.lastRunAt);
          const today = new Date();
          // Check if lastRun is today (same year, month, and day)
          if (
            lastRun.getFullYear() === today.getFullYear() &&
            lastRun.getMonth() === today.getMonth() &&
            lastRun.getDate() === today.getDate()
          ) {
            return count + 1;
          }
        }
        return count;
      }, 0)
    : 0;

  // Calculate total saved jobs across all users
  const totalSavedJobs = Array.isArray(usersData?.users)
    ? usersData.users.reduce((sum, user) => sum + (user.savedJobsCount ?? 0), 0)
    : 0;

  // Calculate next 7:00 AM IST
  const next7amIst = getNext7amIST();

  const handleToggleImport = () => {
    // If currently importing or starting to import, stop it
    if (isAnyImportRunning || startImportMutation.isPending) {
      // Provide immediate feedback for stopping
      stopImportMutation.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Import stopped successfully" });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error ||
                             error?.message ||
                             'Unknown error';
          toast({ title: `Failed to stop import: ${errorMessage}`, variant: "destructive" });
        },
        onSettled: () => {
          // This will run on both success and error
          // Refetch status to update UI
          queryClient.invalidateQueries({ queryKey: ['import', 'status'] });
        }
      });
    } else {
      // Otherwise, start the import
      startImportMutation.mutate(undefined, {
        onSuccess: () => {
          toast({ title: "Import started successfully" });
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error ||
                             error?.message ||
                             'Unknown error';
          toast({ title: `Failed to start import: ${errorMessage}`, variant: "destructive" });
        },
        onSettled: () => {
          // This will run on both success and error
          // Refetch status to update UI
          queryClient.invalidateQueries({ queryKey: ['import', 'status'] });
        }
      });
    }
  };

  // Helper function to determine current import status text
  const getImportStatus = (): string => {
    // Check for loading states first
    if (startImportMutation.isPending) return 'Starting';
    if (stopImportMutation.isPending) return 'Stopping';

    // Check if any import is currently running
    const isAnyImportRunning = Array.isArray(importStatus)
      ? importStatus.some(status => status.isRunning)
      : false;

    if (isAnyImportRunning) return 'Importing';

    // Check for recent errors in logs
    if (Array.isArray(importStatus) && importStatus.length > 0) {
      const recentLogs = importStatus.flatMap(status => status.logs || []);
      const hasError = recentLogs.some(log => log.level === 'error');
      if (hasError) return 'Failed';
    }

    // Check if we have completed successfully (was running, now not with success)
    if (Array.isArray(importStatus) && importStatus.length > 0) {
      const recentlyCompleted = importStatus.some(status =>
        !status.isRunning &&
        status.lastRunAt &&
        new Date(status.lastRunAt).getTime() > Date.now() - 300000 && // Last 5 minutes
        status.logs?.some(log => log.level === 'success')
      );
      if (recentlyCompleted) return 'Completed';
    }

    // Check if we have a stopped state
    if (Array.isArray(importStatus) && importStatus.length > 0) {
      const recentlyStopped = importStatus.some(status =>
        !status.isRunning &&
        status.lastRunAt &&
        new Date(status.lastRunAt).getTime() > Date.now() - 300000 && // Last 5 minutes
        !status.logs?.some(log => log.level === 'error')
      );
      if (recentlyStopped) return 'Stopped';
    }

    // Default to idle
    return 'Idle';
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'idle':
        return 'text-muted-foreground';
      case 'starting':
      case 'stopping':
        return 'text-amber-600';
      case 'importing':
      case 'completed':
        return 'text-emerald-600';
      case 'stopped':
        return 'text-amber-600';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getImportedJobsCount = (): number => {
    return importStats?.totalImportedJobs ?? 0;
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  function handleSuspend(id: string) {
    suspendUser.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User suspended" });
          queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey({}) });
        },
        onError: () => toast({ title: "Failed to suspend user", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">Platform overview and user management.</p>
        </div>
      </div>

      {/* Job Import Control Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Job Import Control</h2>
          <div>
            {/* Dynamic Import Button */}
            <div className="mb-4">
              <Button
                variant={isAnyImportRunning || startImportMutation.isPending ? 'destructive' : 'default'}
                className={`w-full ${
                  // Override default variant to be green for start button
                  !(isAnyImportRunning || startImportMutation.isPending)
                    ? 'bg-green-600 text-green-foreground hover:bg-green-700 border-green-600 hover:border-green-700'
                    : ''  // Use default destructive styling for stop button
                }`}
                onClick={handleToggleImport}
                disabled={isAnyImportRunning || startImportMutation.isPending ? stopImportMutation.isPending : startImportMutation.isPending}
              >
                {startImportMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </div>
                ) : stopImportMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Stopping...
                  </div>
                ) : isAnyImportRunning ? (
                  <div className="flex items-center justify-center gap-2">
                    Stop Import
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Start Import
                  </div>
                )}
              </Button>
            </div>

            {/* Import Status and Statistics */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: getStatusColor(getImportStatus())
                  }}
                ></div>
                <span className="font-medium">{getImportStatus()}</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Jobs Imported: {getImportedJobsCount()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Status Card */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Import Status</h3>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {loadingImportStatus ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <Badge
                    variant={isAnyImportRunning ? 'default' : 'secondary'}
                    className={isAnyImportRunning ? 'bg-muted' : ''}
                  >
                    {isAnyImportRunning ? 'Running' : 'Idle'}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>

          {/* Last Run Time */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Last Run Time</h3>
            </CardHeader>
            <CardContent className="text-lg font-semibold">
              {loadingImportStatus ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{mostRecentLastRun ? formatIST(mostRecentLastRun) : 'Never'}</span>
              )}
            </CardContent>
          </Card>

          {/* Next Run Time */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Next Run Time</h3>
            </CardHeader>
            <CardContent className="text-lg font-semibold">
              {loadingImportStatus ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{soonestNextRun ? formatIST(soonestNextRun) : 'Not scheduled'}</span>
              )}
            </CardContent>
          </Card>

          {/* Next 7:00 AM IST */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Next 7:00 AM IST</h3>
            </CardHeader>
            <CardContent className="text-lg font-semibold">
              <span>{formatIST(next7amIst)}</span>
            </CardContent>
          </Card>

          {/* Total Imported Jobs */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Total Imported Jobs</h3>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {loadingImportStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{importStats?.totalImportedJobs ?? 0}</span>
              )}
            </CardContent>
          </Card>

          {/* Import Started Today */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Import Started Today</h3>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {loadingImportStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{importsStartedToday}</span>
              )}
            </CardContent>
          </Card>

          {/* Jobs Imported Today */}
          <Card className="border">
            <CardHeader className="pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Jobs Imported Today</h3>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {loadingImportStats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span>{importStats?.jobsImportedToday ?? 0}</span>
              )}
            </CardContent>
          </Card>

          {/* Active Sources */}
          <Link href="/admin/sources">
            <Card className="border">
              <CardHeader className="pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Active Sources</h3>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {loadingImportStats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <span>{importStats?.activeSources ?? 0}</span>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Logs */}
        <Card className="border">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Recent Import Logs</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingImportStats ? (
              <div className="text-center py-4">
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (importStatus?.logs?.length ?? 0) > 0 ? (
              <>
                {importStatus.logs.map((log: any) => (
                  <div key={log.id} className="text-sm text-muted-foreground">
                    <time className="mr-2">{new Date(log.timestamp).toLocaleTimeString()}</time>
                    <span>{log.message}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent logs</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingStats ? (
          Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard icon={Users}     label="Total Users"      value={stats?.totalUsers ?? 0}        sub={`+${stats?.newUsersThisWeek ?? 0} this week`} />
            <StatCard icon={Users}     label="Active Users"     value={stats?.activeUsers ?? 0} />
            <StatCard icon={Briefcase} label="Total Jobs"       value={stats?.totalJobs ?? 0} />
            <StatCard icon={BarChart2} label="Applications"     value={stats?.totalApplications ?? 0} sub={`+${stats?.applicationsThisWeek ?? 0} this week`} />
            <StatCard icon={Save}      label="Saved Jobs"       value={totalSavedJobs} />
            <StatCard icon={FileText}  label="Resumes"          value={stats?.totalResumes ?? 0} />
            <StatCard icon={TrendingUp}label="ATS Reports"      value={stats?.totalAtsReports ?? 0} />
            <StatCard icon={TrendingUp}label="New Users / Week" value={stats?.newUsersThisWeek ?? 0} />
            <StatCard icon={BarChart2} label="Apps / Week"      value={stats?.applicationsThisWeek ?? 0} />
          </>
        )}
      </div>

      {/* Users table - responsive */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Users</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email…"
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Responsive container */}
        <div className="space-y-4">
          {/* Table view (md and up) */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Apps</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Saved Jobs</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Resumes</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">ATS</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={8} className="py-3 px-4">
                              <Skeleton className="h-8 w-full" />
                            </td>
                          </tr>
                        ))
                      ) : usersData?.users?.length ? (
                        usersData.users.map((u) => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 flex-shrink-0">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name || "Avatar"} className="rounded-full w-8 h-8 object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
                                      {(u.name || u.email || "?")[0].toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{u.name || "—"}</p>
                                  <p className="text-muted-foreground text-xs">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={u.role === "admin" ? "default" : "secondary"}
                                className={u.role === "admin" ? "bg-primary/20 text-primary hover:bg-primary/30 border-0" : ""}
                              >
                                {u.role ?? "user"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-mono text-center">{u.applicationCount ?? 0}</td>
                            <td className="py-3 px-4 font-mono text-center">{u.savedJobsCount ?? 0}</td>
                            <td className="py-3 px-4 font-mono text-center">{u.resumeCount ?? 0}</td>
                            <td className="py-3 px-4 font-mono text-center">{u.atsReportCount ?? 0}</td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">
                              {new Date(u.createdAt ?? Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {u.role !== "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                  onClick={() => handleSuspend(u.clerkId)}
                                  disabled={suspendUser.isPending}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Suspend
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-muted-foreground">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination for table view */}
            {usersData && (usersData as any).total > 20 && (
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground self-center">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(usersData?.users?.length ?? 0) < 20}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Card view (sm) */}
          <div className="block md:hidden">
            {loadingUsers ? (
              <>
                {[1,2,3].map((_, i) => (
                  <Card key={i} className="border">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : usersData?.users?.length ? (
              usersData.users.map((u) => (
                <Card key={u.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name || "Avatar"} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                            {(u.name || u.email || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || "—"}</p>
                        <p className="text-muted-foreground text-xs">{u.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium">Role</p>
                        <p>{u.role ?? "user"}</p>
                      </div>
                      <div>
                        <p className="font-medium">Apps</p>
                        <p>{u.applicationCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="font-medium">Saved Jobs</p>
                        <p>{u.savedJobsCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="font-medium">Resumes</p>
                        <p>{u.resumeCount ?? 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium">ATS Reports</p>
                        <p>{u.atsReportCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="font-medium">Joined</p>
                        <p>{new Date(u.createdAt ?? Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {u.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 w-full justify-start"
                        onClick={() => handleSuspend(u.clerkId)}
                        disabled={suspendUser.isPending}
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Suspend
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}