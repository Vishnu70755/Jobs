import { useState } from "react";
import { useGetAnalyticsOverview, useGetApplicationTimeline, useGetApplicationsByStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { BarChart2, PieChart as PieIcon, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartType = "bar" | "line" | "area" | "pie";

const CHART_TYPES: { type: ChartType; label: string; icon: React.ElementType }[] = [
  { type: "bar",  label: "Bar",  icon: BarChart2 },
  { type: "line", label: "Line", icon: TrendingUp },
  { type: "area", label: "Area", icon: Activity },
  { type: "pie",  label: "Pie",  icon: PieIcon },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899",
];

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" },
  itemStyle: { color: "hsl(var(--foreground))" },
};

export default function Analytics() {
  const { data: overview, isLoading: loadingOverview } = useGetAnalyticsOverview();
  const { data: timeline, isLoading: loadingTimeline } = useGetApplicationTimeline({ period: "weekly" });
  const { data: statusData, isLoading: loadingStatus } = useGetApplicationsByStatus();

  const [timelineChart, setTimelineChart] = useState<ChartType>("area");
  const [funnelChart, setFunnelChart] = useState<ChartType>("bar");

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Measure your job search performance.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Applications" value={overview?.totalApplications} loading={loadingOverview} color="text-blue-500" />
        <MetricCard title="Response Rate" value={`${overview?.responseRate || 0}%`} loading={loadingOverview} color="text-emerald-500" />
        <MetricCard title="Interview Rate" value={`${overview?.interviewRate || 0}%`} loading={loadingOverview} color="text-purple-500" />
        <MetricCard title="Offers Received" value={overview?.offersReceived} loading={loadingOverview} color="text-yellow-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timeline chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
              <ChartSwitcher value={timelineChart} onChange={setTimelineChart} />
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingTimeline ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {timelineChart === "pie" ? (
                  <PieChart>
                    <Pie data={timeline || []} dataKey="count" nameKey="date" cx="50%" cy="50%" outerRadius={100} label={({ date, count }) => `${date}: ${count}`}>
                      {(timeline || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                  </PieChart>
                ) : timelineChart === "bar" ? (
                  <BarChart data={timeline || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : timelineChart === "line" ? (
                  <LineChart data={timeline || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={timeline || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#areaGradient)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Funnel / pipeline chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Pipeline Funnel</CardTitle>
              <ChartSwitcher value={funnelChart} onChange={setFunnelChart} />
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingStatus ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {funnelChart === "pie" ? (
                  <PieChart>
                    <Pie data={statusData || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status, count }) => count > 0 ? `${status}: ${count}` : ""}>
                      {(statusData || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Legend />
                  </PieChart>
                ) : funnelChart === "line" ? (
                  <LineChart data={statusData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                ) : funnelChart === "area" ? (
                  <AreaChart data={statusData || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#funnelGradient)" />
                  </AreaChart>
                ) : (
                  <BarChart data={statusData || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="status" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} {...TOOLTIP_STYLE} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                      {(statusData || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartSwitcher({ value, onChange }: { value: ChartType; onChange: (t: ChartType) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {CHART_TYPES.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          title={label}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            value === type
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

function MetricCard({ title, value, loading, color }: { title: string; value: any; loading: boolean; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={cn("text-2xl font-bold", color)}>{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
