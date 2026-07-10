import { useState } from "react";
import {
  useGetApplicationBoard,
  useCreateApplication,
  getGetApplicationBoardQueryKey,
  getGetAnalyticsOverviewQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Plus, Building2, ChevronRight, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgoIN, formatOfferedSalary } from "@/lib/format";

const COLUMNS = [
  { status: "saved",               label: "Saved",              color: "text-slate-500",   bg: "bg-slate-500/10",   dot: "bg-slate-400" },
  { status: "applied",             label: "Applied",            color: "text-blue-500",    bg: "bg-blue-500/10",    dot: "bg-blue-500" },
  { status: "under_review",        label: "Under Review",       color: "text-yellow-600",  bg: "bg-yellow-500/10",  dot: "bg-yellow-500" },
  { status: "interview_scheduled", label: "Interview",          color: "text-purple-500",  bg: "bg-purple-500/10",  dot: "bg-purple-500" },
  { status: "offer_received",      label: "Offer",              color: "text-emerald-600", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  { status: "rejected",            label: "Rejected",           color: "text-red-500",     bg: "bg-red-500/10",     dot: "bg-red-400" },
];

export default function Tracker() {
  const { data: board, isLoading } = useGetApplicationBoard();
  const createApp = useCreateApplication();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ company: "", role: "", source: "" });

  const allApps = board?.columns?.flatMap((c) => c.applications ?? []) ?? [];
  const totalCount = allApps.length;

  function handleAdd() {
    if (!form.company.trim() || !form.role.trim()) {
      toast({ title: "Company and role are required", variant: "destructive" });
      return;
    }
    createApp.mutate(
      { data: { company: form.company, role: form.role, source: form.source || undefined, status: "saved" } as any },
      {
        onSuccess: () => {
          toast({ title: "Application added to tracker" });
          setShowAdd(false);
          setForm({ company: "", role: "", source: "" });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAnalyticsOverviewQueryKey() });
        },
      }
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-none px-6 py-5 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount > 0 ? `${totalCount} application${totalCount !== 1 ? "s" : ""} tracked` : "Track your job applications"}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Application
        </Button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading ? (
          <div className="flex gap-4 h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-72 flex-none space-y-3">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => {
              const column = board?.columns?.find((c) => c.status === col.status);
              const apps = column?.applications ?? [];
              return (
                <KanbanColumn
                  key={col.status}
                  col={col}
                  apps={apps}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Add application dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Company *</Label>
              <Input
                placeholder="e.g. TCS, Infosys, Google India"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Input
                placeholder="e.g. Senior Software Engineer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input
                placeholder="e.g. Naukri, LinkedIn, referral…"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createApp.isPending}>
              {createApp.isPending ? "Adding…" : "Add Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanColumn({ col, apps }: { col: typeof COLUMNS[number]; apps: any[] }) {
  return (
    <div className="w-72 flex-none flex flex-col gap-3 h-full max-h-full">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl border", col.bg, "border-transparent")}>
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", col.dot)} />
          <span className={cn("font-semibold text-sm", col.color)}>{col.label}</span>
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full bg-background/60", col.color)}>
          {apps.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {apps.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
            <p className="text-xs text-muted-foreground">No applications</p>
          </div>
        ) : (
          apps.map((app) => <ApplicationCard key={app.id} app={app} col={col} />)
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, col }: { app: any; col: typeof COLUMNS[number] }) {
  return (
    <Link href={`/tracker/${app.id}`}>
      <div className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer space-y-3">
        {/* Company + role */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {app.role}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5 group-hover:text-primary/60 transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{app.company}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {app.appliedAt ? timeAgoIN(app.appliedAt) : "Draft"}
          </span>
          {app.source && (
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground capitalize">
              {app.source}
            </span>
          )}
        </div>

        {/* Salary if present */}
        {(app as any).salaryOffered && (
          <p className="text-xs text-emerald-600 font-medium">
            {formatOfferedSalary(Number((app as any).salaryOffered))} offered
          </p>
        )}
      </div>
    </Link>
  );
}
