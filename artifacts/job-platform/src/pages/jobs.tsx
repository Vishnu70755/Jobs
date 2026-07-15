import React from "react";
 
import { useState, useEffect } from "react";
import { useListJobs, useGetJob, useCreateApplication, useSaveJob, useUnsaveJob, useListApplications, getGetJobQueryKey, getGetApplicationBoardQueryKey, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, MapPin, Briefcase, Clock, Building2, X,
  ChevronRight, Globe, Users, Star, ExternalLink, Send, Wifi, IndianRupee, BookmarkIcon, CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSalaryRange, timeAgoIN } from "@/lib/format";

const WORK_MODES = [
  { value: "all", label: "All Types" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const POSTED_WITHIN = [
  { value: "all", label: "Any time" },
  { value: "24h", label: "Past 24 hours" },
  { value: "3d", label: "Past 3 days" },
  { value: "7d", label: "Past week" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Most Recent" },
  { value: "salary", label: "Salary" },
  { value: "company", label: "Company" },
];

const SOURCES = ["LinkedIn", "Indeed", "Naukri", "Wellfound", "Glassdoor", "Lever", "Greenhouse", "Instahyre"];

const WORK_MODE_STYLES: Record<string, string> = {
  remote: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  hybrid: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  onsite: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function Jobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [postedWithin, setPostedWithin] = useState("all");
  const [source, setSource] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params: Record<string, string> = { sortBy, limit: "50" };
  if (debouncedSearch) params.search = debouncedSearch;
  if (workMode !== "all") params.workMode = workMode;
  if (postedWithin !== "all") params.postedWithin = postedWithin;
  if (source !== "all") params.source = source;

  const { data, isLoading } = useListJobs(params);
  const { data: selectedJob, isLoading: loadingDetail } = useGetJob(selectedJobId!, {
    query: { enabled: !!selectedJobId, queryKey: getGetJobQueryKey(selectedJobId ?? 0) },
  });
  const createApp = useCreateApplication();
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();

  const jobs = data?.jobs ?? [];
  const activeFiltersCount = [
    workMode !== "all", postedWithin !== "all", source !== "all", !!debouncedSearch
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setWorkMode("all");
    setPostedWithin("all");
    setSource("all");
    setSortBy("latest");
  }

  const handleToggleSave = () => {
    if (!selectedJob) return;

    if (selectedJob.isSaved) {
      unsaveJobMutation.mutate({ id: selectedJob.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(selectedJob.id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job removed from saved list" });
        }
      });
    } else {
      saveJobMutation.mutate({ id: selectedJob.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(selectedJob.id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job saved successfully" });
        }
      });
    }
  };

  function handleApply() {
    if (!selectedJob) return;
    setApplying(true);
    createApp.mutate(
      {
        data: {
          jobId: selectedJob.id,
          company: selectedJob.company,
          role: selectedJob.title,
          status: "applied",
          source: selectedJob.source ?? undefined,
        } as any,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(selectedJob.id) });
          toast({ title: "Application tracked!", description: `${selectedJob.title} at ${selectedJob.company} added to your tracker.` });
          setApplying(false);
        },
        onError: () => {
          toast({ title: "Already tracked", description: "This job is already in your tracker.", variant: "destructive" });
          setApplying(false);
        },
      }
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Top filter bar ── */}
      <div className="flex-none border-b border-border bg-background px-6 py-3 space-y-3">
        {/* Row 1: search + filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search jobs, companies, skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <Select value={workMode} onValueChange={setWorkMode}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORK_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={postedWithin} onValueChange={setPostedWithin}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSTED_WITHIN.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Row 2: result count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{jobs.length}</span> jobs found
          {activeFiltersCount > 0 && <span>— {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active</span>}
        </div>
      </div>

      {/* ── Main two-column body ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left: jobs list */}
        <div className={cn(
          "flex-none overflow-y-auto border-r border-border mb-4 md:mb-0",
          selectedJobId ? "md:w-[420px]" : ""
        )}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No jobs found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
              {activeFiltersCount > 0 && (
                <Button variant="link" className="mt-2" onClick={clearFilters}>Clear all filters</Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => {
                const salary = formatSalaryRange(
                  (job as any).salaryMin,
                  (job as any).salaryMax,
                  (job as any).salaryCurrency ?? "USD"
                );
                const isSelected = selectedJobId === job.id;
                return (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(isSelected ? null : job.id)}
                    className={cn(
                      "w-full text-left px-4 py-4 transition-colors hover:bg-muted/50 focus:outline-none",
                      isSelected && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-semibold text-sm leading-tight truncate", isSelected && "text-primary")}>
                            {job.title}
                          </p>
                          {(job as any).isHot && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={cn("text-xs capitalize", WORK_MODE_STYLES[job.workMode ?? ""] ?? "")}
                        >
                          {job.workMode}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {job.createdAt ? timeAgoIN(job.createdAt) : ""}
                        </span>
                      </div>
                    </div>
                    {salary && (
                      <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />{salary}
                      </p>
                    )}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {job.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                            {s}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{job.skills.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: job detail panel */}
        {selectedJobId && (
          <div className="flex-1 overflow-y-auto w-full">
            {loadingDetail ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : selectedJob ? (
              <JobDetailPanel
                job={selectedJob as any}
                onApply={handleApply}
                applying={applying || createApp.isPending}
                onClose={() => setSelectedJobId(null)}
              />
            ) : null}
          </div>
        )}

        {/* Right: empty state when nothing selected */}
        {!selectedJobId && !isLoading && jobs.length > 0 && (
          <div className="hidden md:flex flex-1 items-center justify-center text-center px-8 border-l border-border">
            <div>
              <ChevronRight className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Select a job to see details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobDetailPanel({
  job,
  onApply,
  applying,
  onClose,
}: {
  job: any;
  onApply: () => void;
  applying: boolean;
  onClose: () => void;
}) {
  const [isTracked, setIsTracked] = useState(false);
  const { data: applications } = useListApplications({ query: { queryKey: getListApplicationsQueryKey() } });

  useEffect(() => {
    if (applications && job) {
      const tracked = applications.some(app => app.jobId === job.id);
      setIsTracked(tracked);
    }
  }, [applications, job]);

  const salary = formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency ?? "USD");
  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleToggleSave = () => {
    if (job.isSaved) {
      unsaveJobMutation.mutate({ id: job.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job removed from saved list" });
        }
      });
    } else {
      saveJobMutation.mutate({ id: job.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job saved successfully" });
        }
      });
    }
  };

  const handleTrack = () => {
    if (isTracked || !job) {
      // If already tracked, show a toast and return
      toast({ title: "Already tracked", description: "This job is already in your tracker.", variant: "destructive" });
      return;
    }
    // Call the onApply function (which is the createApp mutation)
    onApply();
    // Optimistically set to true
    setIsTracked(true);
    // Invalidate queries to update the application list elsewhere
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(job.id) });
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold tracking-tight">{job.title}</h2>
            {job.isHot && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
          </div>
          <p className="text-lg text-muted-foreground">{job.company}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={cn("capitalize", WORK_MODE_STYLES[job.workMode ?? ""] ?? "")}>
          {job.workMode === "remote" && <Wifi className="w-3 h-3 mr-1" />}
          {job.workMode === "onset" && <Building2 className="w-3 h-3 mr-1" />}
          {job.workMode === "hybrid" && <Globe className="w-3 h-3 mr-1" />}
          {job.workMode}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <MapPin className="w-3 h-3" />{job.location}
        </Badge>
        {salary && (
          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
            <IndianRupee className="w-3 h-3" />{salary}
          </Badge>
        )}
        {job.experience && (
          <Badge variant="outline" className="gap-1">
            <Briefcase className="w-3 h-3" />{job.experience}
          </Badge>
        )}
        {job.source && (
          <Badge variant="outline" className="gap-1">
            <Globe className="w-3 h-3" />{job.source}
          </Badge>
        )}
        {job.createdAt && (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />{timeAgoIN(job.createdAt)}
          </Badge>
        )}
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Button
          onClick={handleToggleSave}
          disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
          variant={job.isSaved ? "default" : "outline"}
          size="lg"
          className={job.isSaved ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
        >
          <BookmarkIcon className={`w-4 h-4 mr-2 ${job.isSaved ? 'fill-current' : ''}`} />
          {saveJobMutation.isPending ? "Saving…" : unsaveJobMutation.isPending ? "Unsaving…" : job.isSaved ? 'Saved' : 'Save'}
        </Button>
        <Button
          onClick={handleTrack}
          disabled={applying || isTracked}
          variant={isTracked ? "default" : "outline"}
          size="lg"
          className={isTracked ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
        >
          <Send className="w-4 h-4 mr-2" />
          {isTracked ? (
            <>
              <CheckCheck className="w-4 h-4 mr-2" />
              Tracked
            </>
          ) : (
            "Track Application"
          )}
        </Button>
        {job.applyUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Apply Externally
            </a>
          </Button>
        )}
      </div>

      <Separator />

      {/* Description */}
      {job.description && (
        <div>
          <h3 className="font-semibold mb-2">About the Role</h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s: string) => (
              <Badge key={s} variant="secondary" className="text-sm">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Company info */}
      <div className="rounded-xl border border-border p-4 space-y-2 bg-muted/30">
        <h3 className="font-semibold text-sm">About {job.company}</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {job.companySize && (
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />{job.companySize} employees
            </span>
          )}
          {job.industry && (
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />{job.industry}
            </span>
          )}
        </div>
      </div>
      </div>
  );
}
