import { useState } from "react";
import {
  useListResumes,
  useListAtsReports,
  useAnalyzeResume,
  getListAtsReportsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, Zap, FileText } from "lucide-react";

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`text-6xl font-black tracking-tighter ${color}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {score}
      </div>
      <div className="text-sm text-muted-foreground">ATS Score</div>
      <div
        className={`text-xs font-medium ${color}`}
      >
        {score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Needs Work"}
      </div>
    </div>
  );
}

export default function AtsAnalyzer() {
  const { data: resumes, isLoading: loadingResumes } = useListResumes();
  const { data: reports, isLoading: loadingReports } = useListAtsReports();
  const analyzeResume = useAnalyzeResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [activeReport, setActiveReport] = useState<(typeof reports extends Array<infer T> ? T : never) | null>(null);

  function handleAnalyze() {
    if (!selectedResumeId) {
      toast({ title: "Please select a resume", variant: "destructive" });
      return;
    }
    if (jobDescription.trim().length < 30) {
      toast({ title: "Please paste a job description (at least 30 characters)", variant: "destructive" });
      return;
    }
    analyzeResume.mutate(
      { data: { resumeId: selectedResumeId, jobDescription } },
      {
        onSuccess: (data) => {
          setActiveReport(data as any);
          queryClient.invalidateQueries({ queryKey: getListAtsReportsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
          toast({ title: "Analysis complete!" });
        },
        onError: () => {
          toast({ title: "Analysis failed", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ATS Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          Score your resume against any job description.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Select Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingResumes ? (
              <Skeleton className="h-20 w-full" />
            ) : resumes?.length ? (
              resumes.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedResumeId === r.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <FileText
                    className={`w-5 h-5 flex-shrink-0 ${selectedResumeId === r.id ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    {r.isDefault && (
                      <span className="text-xs text-primary">Default</span>
                    )}
                  </div>
                  {selectedResumeId === r.id && (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No resumes found.{" "}
                <a href="/resumes" className="text-primary underline">
                  Add one first.
                </a>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Paste Job Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste the full job description here…"
              className="min-h-[200px] resize-none text-sm"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <Button
              className="w-full gap-2"
              onClick={handleAnalyze}
              disabled={analyzeResume.isPending || !selectedResumeId}
            >
              <Zap className="w-4 h-4" />
              {analyzeResume.isPending ? "Analyzing…" : "Analyze Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {activeReport && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex items-center justify-center md:col-span-1">
                <ScoreRing score={(activeReport as any).score ?? 0} />
              </div>
              <div className="md:col-span-3 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                      ✅ Keywords Present
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {((activeReport as any).presentKeywords as string[])?.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-green-600 bg-green-500/10 border-0">
                          {kw}
                        </Badge>
                      ))}
                      {!((activeReport as any).presentKeywords as string[])?.length && (
                        <span className="text-sm text-muted-foreground">None detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                      ❌ Missing Keywords
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {((activeReport as any).missingKeywords as string[])?.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-red-500 bg-red-500/10 border-0">
                          {kw}
                        </Badge>
                      ))}
                      {!((activeReport as any).missingKeywords as string[])?.length && (
                        <span className="text-sm text-muted-foreground">None — great match!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                    💡 Suggestions
                  </Label>
                  <ul className="space-y-1.5">
                    {((activeReport as any).suggestions as string[])?.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeReport && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Past Reports</h2>
          {loadingReports ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : reports?.length ? (
            <div className="space-y-3">
              {reports.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setActiveReport(r as any)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Report #{r.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-2xl font-bold ${
                          (r as any).score >= 75
                            ? "text-green-500"
                            : (r as any).score >= 50
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {(r as any).score}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                No analysis reports yet. Run your first analysis above.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
