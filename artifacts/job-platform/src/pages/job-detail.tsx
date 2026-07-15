import React from "react";
 
import { useGetJob, useGetSimilarJobs, useSaveJob, useUnsaveJob, useCreateApplication, useListApplications, useDeleteApplication, getListApplicationsQueryKey, getGetJobQueryKey, getGetApplicationBoardQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ExternalLink, MapPin, DollarSign, Building2, Briefcase, Send, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function JobDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { data: job, isLoading } = useGetJob(id, { query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } });
  const { data: similarJobs, isLoading: isLoadingSimilar } = useGetSimilarJobs(id, { query: { enabled: !!id, queryKey: [`/api/jobs/${id}/similar`] as const } });

  const saveJobMutation = useSaveJob();
  const unsaveJobMutation = useUnsaveJob();
  const createAppMutation = useCreateApplication();
  const { data: applications } = useListApplications({ query: { queryKey: getListApplicationsQueryKey() } });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTracked, setIsTracked] = useState(false);

  // Check if job is already tracked
  useEffect(() => {
    if (applications && job) {
      const tracked = applications.some(app => app.jobId === job.id);
      setIsTracked(tracked);
    }
  }, [applications, job]);

  const handleToggleSave = () => {
    if (!job) return;

    if (job.isSaved) {
      unsaveJobMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job removed from saved list" });
        },
        onError: (error: any) => {
          toast({ title: "Failed to remove from saved list", variant: "destructive" });
        }
      });
    } else {
      saveJobMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Job saved successfully" });
        },
        onError: (error: any) => {
          if (error?.response?.status === 409 || error?.message?.includes("already")) {
            toast({ title: "Already saved", description: "This job is already in your saved list.", variant: "destructive" });
          } else {
            toast({ title: "Failed to save job", variant: "destructive" });
          }
        }
      });
    }
  };

  const handleTrack = () => {
    if (!job || isTracked) return;

    createAppMutation.mutate(
      {
        data: {
          jobId: job.id,
          company: job.company,
          role: job.title,
          status: "applied",
          source: job.source ?? undefined,
        } as any,
      },
      {
        onSuccess: () => {
          setIsTracked(true);
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Application tracked!", description: `${job.title} at ${job.company} added to your tracker.` });
        },
        onError: (error: any) => {
          if (error?.response?.status === 409 || error?.message?.includes("already")) {
            setIsTracked(true);
            toast({ title: "Already tracked", description: "This job is already in your tracker.", variant: "destructive" });
          } else {
            toast({ title: "Failed to track application", variant: "destructive" });
          }
        },
      }
    );
  };

  const handleUntrack = () => {
    if (!job || !isTracked) return;

    // Find the application for this job
    const app = applications?.find(a => a.jobId === job.id);
    if (!app) return;

    const deleteAppMutation = useDeleteApplication();
    deleteAppMutation.mutate(
      { id: app.id },
      {
        onSuccess: () => {
          setIsTracked(false);
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetApplicationBoardQueryKey() });
          toast({ title: "Application untracked" });
        },
        onError: () => toast({ title: "Failed to untrack", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full text-center py-20">
        <h2 className="text-2xl font-bold">Job not found</h2>
        <Link href="/jobs">
          <Button variant="link" className="mt-4">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full pb-24">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              {job.isNew && <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">New</Badge>}
              {job.isHot && <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30">Hot</Badge>}
            </div>
            <p className="text-xl text-muted-foreground">{job.company}</p>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</div>
              <div className="flex items-center gap-1.5 capitalize"><Briefcase className="w-4 h-4" /> {job.workMode}</div>
              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> 
                  {job.salaryMin ? `${job.salaryMin / 1000}k` : ''} 
                  {job.salaryMin && job.salaryMax ? ' - ' : ''} 
                  {job.salaryMax ? `${job.salaryMax / 1000}k` : ''} 
                  {job.salaryCurrency || 'USD'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Track Application Button */}
            <Button
              variant={isTracked ? "default" : "outline"}
              size="lg"
              onClick={isTracked ? handleUntrack : handleTrack}
              disabled={createAppMutation.isPending}
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

            {/* Save Button */}
            <Button
              variant={job.isSaved ? "default" : "outline"}
              size="lg"
              onClick={handleToggleSave}
              disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
              className={job.isSaved ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
            >
              <BookmarkIcon className={`w-5 h-5 mr-2 ${job.isSaved ? 'fill-current' : ''}`} />
              {saveJobMutation.isPending ? "Saving…" : unsaveJobMutation.isPending ? "Unsaving…" : job.isSaved ? 'Saved' : 'Save'}
            </Button>

            {/* Apply Externally */}
            <Button size="lg" className="px-8" asChild>
              <a href={job.applyUrl || "#"} target="_blank" rel="noreferrer">
                Apply Now <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                {job.description || "No description provided."}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.skills?.length ? (
                  job.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 text-sm">{skill}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">Not specified</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-muted-foreground">{job.company}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Source</p>
                <p className="text-muted-foreground capitalize">{job.source}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Posted</p>
                <p className="text-muted-foreground">
                  {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Similar Jobs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSimilar ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : similarJobs?.length ? (
                similarJobs.map(sj => (
                  <Link key={sj.id} href={`/jobs/${sj.id}`}>
                    <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group">
                      <p className="font-medium group-hover:text-primary transition-colors line-clamp-1">{sj.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{sj.company} • {sj.location}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No similar jobs found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
