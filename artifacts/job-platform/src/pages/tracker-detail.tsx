import React from "react";
 
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Save, CalendarPlus, Bell, ExternalLink, CheckCircle2, IndianRupee } from "lucide-react";
import { buildGoogleCalendarUrl, formatISTDatetime, formatOfferedSalary } from "@/lib/format";

const STATUSES = [
  { value: "saved",               label: "Saved" },
  { value: "applied",             label: "Applied" },
  { value: "under_review",        label: "Under Review" },
  { value: "pending",             label: "Pending" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "in_process",          label: "In Process" },
  { value: "rejected",            label: "Rejected" },
  { value: "ghosted",             label: "Ghosted" },
  { value: "offer_received",      label: "Offer Received" },
  { value: "accepted",            label: "Accepted" },
  { value: "declined",            label: "Declined" },
];

const STATUS_COLORS: Record<string, string> = {
  saved:               "bg-slate-500/10 text-slate-500",
  applied:             "bg-blue-500/10 text-blue-500",
  under_review:        "bg-yellow-500/10 text-yellow-600",
  pending:             "bg-orange-500/10 text-orange-500",
  interview_scheduled: "bg-purple-500/10 text-purple-500",
  in_process:          "bg-indigo-500/10 text-indigo-500",
  rejected:            "bg-red-500/10 text-red-500",
  ghosted:             "bg-gray-500/10 text-gray-500",
  offer_received:      "bg-green-500/10 text-green-500",
  accepted:            "bg-emerald-500/10 text-emerald-600",
  declined:            "bg-rose-500/10 text-rose-500",
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TrackerDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { data: app, isLoading } = useGetApplication(id, { query: { enabled: !!id, queryKey: getGetApplicationQueryKey(id) } });
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const [form, setForm] = useState<{
    status: string;
    notes: string;
    recruiterName: string;
    recruiterEmail: string;
    interviewDate: string;
    salaryOffered: string;
    interviewMode: "online" | "offline" | "telephonic" | "";
    meetingLink: string;
  } | null>(null);

  if (app && !form) {
    setForm({
      status: app.status ?? "saved",
      notes: (app as any).notes ?? "",
      recruiterName: (app as any).recruiterName ?? "",
      recruiterEmail: (app as any).recruiterEmail ?? "",
      interviewDate: (app as any).interviewDate
        ? new Date((app as any).interviewDate).toISOString()
        : "",
      salaryOffered: (app as any).salaryOffered?.toString() ?? "",
      interviewMode: (app as any).interviewMode ?? "",
      meetingLink: (app as any).meetingLink ?? "",
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
          interviewMode: form.interviewMode || undefined,
          meetingLink: form.meetingLink || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          toast({ title: "Application updated" });
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          setLocation("/tracker");
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

  function handleAddToCalendar() {
    if (!form?.interviewDate || form.interviewDate === "" || !app) return;
    const url = buildGoogleCalendarUrl({
      title: `Interview — ${(app as any).role} at ${(app as any).company}`,
      start: form.interviewDate,
      durationMins: 60,
      company: (app as any).company ?? "",
      role: (app as any).role ?? "",
      mode: (form.interviewMode || undefined) as any,
      meetingLink: form.meetingLink || undefined,
      notes: form.notes || undefined,
      recruiterEmail: form.recruiterEmail || undefined,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    setCalendarAdded(true);
    toast({
      title: "Google Calendar opened",
      description: "Save the pre-filled event to add it to your calendar (IST).",
    });
  }

  async function handleEnableReminders() {
    if (!("Notification" in window)) {
      toast({ title: "Browser notifications not supported", variant: "destructive" });
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      toast({ title: "Reminders enabled!", description: "You'll get notified before your interview." });
      if (form?.interviewDate && form.interviewDate !== "") {
        const days = daysUntil(form.interviewDate);
        const title = `Interview Reminder — ${(app as any)?.role} at ${(app as any)?.company}`;
        if (days > 0 && days <= 2) {
          new Notification(title, {
            body: `Your interview is in ${days} day${days === 1 ? "" : "s"}! Don't forget to prepare.`,
            icon: "/favicon.ico",
          });
        } else if (days > 2) {
          toast({
            title: "Reminder scheduled",
            description: `We'll remind you 2 days before your interview on ${formatISTDatetime(form.interviewDate)}.`,
          });
        }
      }
    } else {
      toast({ title: "Notification permission denied", variant: "destructive" });
    }
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

  const isInterviewScheduled = form.status === "interview_scheduled";
  const hasInterviewDate = !!form.interviewDate && form.interviewDate !== "";
  const daysUntilInterview = hasInterviewDate ? daysUntil(form.interviewDate) : null;
  const interviewSoon = daysUntilInterview !== null && daysUntilInterview <= 2 && daysUntilInterview >= 0;

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto w-full pb-24">
      {/* Header */}
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

      {/* Interview soon banner */}
      {interviewSoon && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-purple-600 dark:text-purple-400">
                {daysUntilInterview === 0 ? "Interview is today!" : `Interview in ${daysUntilInterview} day${daysUntilInterview === 1 ? "" : "s"}!`}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatISTDatetime(form.interviewDate)}
              </p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-0">Upcoming</Badge>
        </div>
      )}

      {/* Status */}
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

      {/* Recruiter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recruiter</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Recruiter Name</Label>
            <Input
              placeholder="e.g. Priya Sharma"
              value={form.recruiterName}
              onChange={(e) => setForm((f) => f ? { ...f, recruiterName: e.target.value } : f)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Recruiter Email</Label>
            <Input
              type="email"
              placeholder="priya@company.com"
              value={form.recruiterEmail}
              onChange={(e) => setForm((f) => f ? { ...f, recruiterEmail: e.target.value } : f)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interview & Offer */}
      <Card className={isInterviewScheduled ? "border-purple-500/30 ring-1 ring-purple-500/20" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Interview & Offer
                {isInterviewScheduled && (
                  <Badge className="bg-purple-500/10 text-purple-500 border-0 text-xs">Scheduled</Badge>
                )}
              </CardTitle>
              {isInterviewScheduled && (
                <CardDescription className="mt-1">
                  Set interview details below — then add to Google Calendar (IST).
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Interview Date & Time (IST)</Label>
              <DateTimePicker
                value={form.interviewDate || null}
                onChange={(value) => {
                  setForm((f) => f ? { ...f, interviewDate: value ?? "" } : f);
                  setCalendarAdded(false);
                }}
                minDate={new Date()} // Prevent past dates
              />
              {hasInterviewDate && (
                <p className="text-xs text-muted-foreground">
                  {formatISTDatetime(form.interviewDate)}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Salary Offered (₹ per year)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="e.g. 1800000 (₹18 LPA)"
                  className="pl-8"
                  value={form.salaryOffered}
                  onChange={(e) => setForm((f) => f ? { ...f, salaryOffered: e.target.value } : f)}
                />
              </div>
              {form.salaryOffered && (
                <p className="text-xs text-emerald-600 font-medium">
                  {formatOfferedSalary(Number(form.salaryOffered))}
                </p>
              )}
            </div>
          </div>

          {/* Interview Mode & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Interview Mode</Label>
              <Select
                value={form.interviewMode}
                onValueChange={(v) => setForm((f) => f ? { ...f, interviewMode: v as any } : f)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">💻 Online (Video Call)</SelectItem>
                  <SelectItem value="telephonic">📞 Telephonic</SelectItem>
                  <SelectItem value="offline">🏢 In-Person / Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {form.interviewMode === "offline" ? "Office Location" : "Meeting Link / Phone"}
              </Label>
              <Input
                placeholder={
                  form.interviewMode === "offline"
                    ? "e.g. Google, Bengaluru, Karnataka"
                    : form.interviewMode === "telephonic"
                    ? "e.g. +91-9876543210"
                    : "https://meet.google.com/…"
                }
                value={form.meetingLink}
                onChange={(e) => setForm((f) => f ? { ...f, meetingLink: e.target.value } : f)}
              />
            </div>
          </div>

          {/* Google Calendar + Reminder buttons */}
          {hasInterviewDate && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant={calendarAdded ? "default" : "outline"}
                className={`gap-2 ${calendarAdded
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                }`}
                onClick={handleAddToCalendar}
              >
                {calendarAdded ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <CalendarPlus className="w-4 h-4" />
                )}
                {calendarAdded ? "Calendar Opened ✓" : "Add to Google Calendar"}
                {!calendarAdded && <ExternalLink className="w-3 h-3 opacity-60" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`gap-2 ${notifEnabled ? "border-green-500/40 text-green-600 dark:text-green-400 bg-green-500/5" : "border-border"}`}
                onClick={handleEnableReminders}
              >
                <Bell className="w-4 h-4" />
                {notifEnabled ? "Reminders On ✓" : "Browser Reminders"}
              </Button>
            </div>
          )}

          {isInterviewScheduled && !hasInterviewDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4" />
              Set interview date &amp; time above to sync with Google Calendar (IST).
            </p>
          )}

          {calendarAdded && hasInterviewDate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Google Calendar opened with pre-filled event at <strong>{formatISTDatetime(form.interviewDate)}</strong>.
                Save the event in the Google tab to confirm.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Preparation Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about this application, interview feedback, topics to prepare, follow-up actions…"
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
