import { useState } from "react";
import {
  useGetApplication,
  useUpdateApplication,
  useDeleteApplication,
  getGetApplicationQueryKey,
  getGetApplicationBoardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Save } from "lucide-react";

const STATUSES = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "pending", label: "Pending" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "in_process", label: "In Process" },
  { value: "rejected", label: "Rejected" },
  { value: "ghosted", label: "Ghosted" },
  { value: "offer_received", label: "Offer Received" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-slate-500/10 text-slate-500",
  applied: "bg-blue-500/10 text-blue-500",
  under_review: "bg-yellow-500/10 text-yellow-600",
  pending: "bg-orange-500/10 text-orange-500",
  interview_scheduled: "bg-purple-500/10 text-purple-500",
  in_process: "bg-indigo-500/10 text-indigo-500",
  rejected: "bg-red-500/10 text-red-500",
  ghosted: "bg-gray-500/10 text-gray-500",
  offer_received: "bg-green-500/10 text-green-500",
  accepted: "bg-emerald-500/10 text-emerald-600",
  declined: "bg-rose-500/10 text-rose-500",
};

export default function TrackerDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { data: app, isLoading } = useGetApplication(id, { query: { enabled: !!id } });
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<{
    status: string;
    notes: string;
    recruiterName: string;
    recruiterEmail: string;
    interviewDate: string;
    salaryOffered: string;
  } | null>(null);

  if (app && !form) {
    setForm({
      status: app.status ?? "saved",
      notes: (app as any).notes ?? "",
      recruiterName: (app as any).recruiterName ?? "",
      recruiterEmail: (app as any).recruiterEmail ?? "",
      interviewDate: (app as any).interviewDate
        ? new Date((app as any).interviewDate).toISOString().slice(0, 16)
        : "",
      salaryOffered: (app as any).salaryOffered?.toString() ?? "",
    });
  }

  function handleSave() {
    if (!form) return;
    updateApp.mutate(
      {
        id,
        data: {
          status: form.status,
          notes: form.notes,
          recruiterName: form.recruiterName,
          recruiterEmail: form.recruiterEmail,
          interviewDate: form.interviewDate || undefined,
          salaryOffered: form.salaryOffered ? Number(form.salaryOffered) : undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Application updated" });
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  }

  function handleDelete() {
    deleteApp.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Application deleted" });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          setLocation("/tracker");
        },
      }
    );
  }

  if (isLoading || !form) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-60 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center max-w-3xl mx-auto py-20">
        <h2 className="text-xl font-bold">Application not found</h2>
        <Link href="/tracker">
          <Button variant="link" className="mt-2">Back to Tracker</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto w-full pb-24">
      <div className="flex items-center gap-3">
        <Link href="/tracker">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{(app as any).role}</h1>
          <p className="text-muted-foreground">{(app as any).company}</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={handleDelete}
          disabled={deleteApp.isPending}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setForm((f) => f ? { ...f, status: s.value } : f)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  form.status === s.value
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background " + (STATUS_COLORS[s.value] ?? "")
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recruiter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Recruiter Name</Label>
            <Input
              placeholder="Jane Smith"
              value={form.recruiterName}
              onChange={(e) => setForm((f) => f ? { ...f, recruiterName: e.target.value } : f)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Recruiter Email</Label>
            <Input
              type="email"
              placeholder="jane@company.com"
              value={form.recruiterEmail}
              onChange={(e) => setForm((f) => f ? { ...f, recruiterEmail: e.target.value } : f)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview & Offer</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Interview Date</Label>
            <Input
              type="datetime-local"
              value={form.interviewDate}
              onChange={(e) => setForm((f) => f ? { ...f, interviewDate: e.target.value } : f)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Salary Offered ($)</Label>
            <Input
              type="number"
              placeholder="120000"
              value={form.salaryOffered}
              onChange={(e) => setForm((f) => f ? { ...f, salaryOffered: e.target.value } : f)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about this application, interview feedback, follow-up actions…"
            className="min-h-[140px] resize-none"
            value={form.notes}
            onChange={(e) => setForm((f) => f ? { ...f, notes: e.target.value } : f)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={updateApp.isPending} size="lg" className="gap-2">
          <Save className="w-4 h-4" />
          {updateApp.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
