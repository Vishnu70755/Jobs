import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import {
  useGetAdminStats,
  useListAdminUsers,
  useSuspendUser,
  getListAdminUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Briefcase, FileText, BarChart2, TrendingUp, ShieldAlert, Search, UserX, Lock,
} from "lucide-react";

const ADMIN_EMAIL = "vishnu252223@gmail.com";

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

export default function Admin() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: loadingStats } = useGetAdminStats();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: usersData, isLoading: loadingUsers } = useListAdminUsers({ search: search || undefined, page });
  const suspendUser = useSuspendUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }

  if (!user || userEmail !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">
          This page is restricted to the platform administrator only.
        </p>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loadingStats ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub={`+${stats?.newUsersThisWeek ?? 0} this week`} />
            <StatCard icon={Users} label="Active Users" value={stats?.activeUsers ?? 0} />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats?.totalJobs ?? 0} />
            <StatCard icon={BarChart2} label="Applications" value={stats?.totalApplications ?? 0} sub={`+${stats?.applicationsThisWeek ?? 0} this week`} />
            <StatCard icon={FileText} label="Resumes" value={stats?.totalResumes ?? 0} />
            <StatCard icon={TrendingUp} label="ATS Reports" value={stats?.totalAtsReports ?? 0} />
            <StatCard icon={TrendingUp} label="New Users / Week" value={stats?.newUsersThisWeek ?? 0} />
            <StatCard icon={BarChart2} label="Apps / Week" value={stats?.applicationsThisWeek ?? 0} />
          </>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">User</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Apps</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Resumes</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="py-3 px-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : usersData?.users?.length ? (
                    usersData.users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium truncate max-w-[200px]">{u.name || "—"}</p>
                          <p className="text-muted-foreground text-xs truncate max-w-[200px]">{u.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={u.role === "admin" ? "default" : "secondary"}
                            className={u.role === "admin" ? "bg-primary/20 text-primary hover:bg-primary/30 border-0" : ""}
                          >
                            {u.role ?? "user"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono">{(u as any).applicationCount ?? 0}</td>
                        <td className="py-3 px-4 font-mono">{(u as any).resumeCount ?? 0}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date((u as any).createdAt ?? Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                              onClick={() => handleSuspend((u as any).clerkId)}
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
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
}
