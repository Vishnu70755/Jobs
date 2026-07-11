import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#0ea5e9",
];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  },
  itemStyle: { color: "hsl(var(--foreground))" },
};

const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [cityData, setCityData] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [stateData, setStateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineChart, setTimelineChart] = useState<ChartType>("area");
  const [funnelChart, setFunnelChart] = useState<ChartType>("bar");
  const [cityChart, setCityChart] = useState<ChartType>("bar");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          overviewRes,
          timelineRes,
          statusRes,
          cityRes,
          salaryRes,
          stateRes
        ] = await Promise.all([
          fetch('/api/analytics/overview').then(r => r.json()),
          fetch('/api/analytics/timeline?period=weekly').then(r => r.json()),
          fetch('/api/analytics/by-status').then(r => r.json()),
          fetch('/api/analytics/city-distribution').then(r => r.json()),
          fetch('/api/analytics/salary-bands').then(r => r.json()),
          fetch('/api/analytics/state-distribution').then(r => r.json()),
        ]);
        setOverview(overviewRes);
        setTimeline(timelineRes);
        setStatusData(statusRes);
        setCityData(cityRes);
        setSalaryData(salaryRes);
        setStateData(stateRes);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">Measure your job search performance — IST timezone.</p>
        </div>

        {/* KPI row - skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCard key={i} title="Loading" value="--" loading={true} />
          ))}
        </div>

        {/* Charts row 1 - skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Loading...</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row 2 - skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Loading...</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Skeleton className="w-full h-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* State-wise table - skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Measure your job search performance — IST timezone.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Applications" value={overview?.totalApplications ?? 0} loading={false} color="text-blue-500" />
        <MetricCard title="Response Rate" value={`${overview?.responseRate ?? 0}%`} loading={false} color="text-emerald-500" />
        <MetricCard title="Interview Rate" value={`${overview?.interviewRate ?? 0}%`} loading={false} color="text-purple-500" />
        <MetricCard title="Offers Received" value={overview?.offersReceived ?? 0} loading={false} color="text-yellow-500" />
      </div>

      {/* Charts row 1: timeline + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Activity Timeline</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Applications per week (IST)</p>
              </div>
              <ChartSwitcher value={timelineChart} onChange={setTimelineChart} />
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {timelineChart === "pie" ? (
                <PieChart>
                  <Pie
                    data={timeline.filter((d) => (d.count ?? 0) > 0)}
                    dataKey="count"
                    nameKey="date"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {timeline.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              ) : timelineChart === "bar" ? (
                <BarChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              ) : timelineChart === "line" ? (
                <LineChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              ) : (
                <AreaChart data={timeline} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#areaGradient)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel / pipeline chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pipeline Funnel</CardTitle>
              <ChartSwitcher value={funnelChart} onChange={setFunnelChart} />
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {funnelChart === "pie" ? (
                <PieChart>
                  <Pie
                    data={statusData.filter((d) => (d.count ?? 0) > 0)}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              ) : funnelChart === "line" ? (
                <LineChart data={statusData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                </LineChart>
              ) : funnelChart === "area" ? (
                <AreaChart data={statusData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <defs>
                    <linearGradient id="funnelGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#funnelGradient)" />
                </AreaChart>
              ) : (
                <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="status" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={105} />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: City distribution + Salary bands in INR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">City-wise Distribution</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Job opportunities by Indian city</p>
              </div>
              <ChartSwitcher value={cityChart} onChange={setCityChart} />
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {cityChart === "pie" ? (
                <PieChart>
                  <Pie
                    data={cityData}
                    dataKey="count"
                    nameKey="city"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {cityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              ) : (
                <BarChart
                  data={cityData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="city"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <RechartsTooltip cursor={{ fill: "hsl(var(--muted))" }} {...TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {cityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary distribution in INR */}
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Salary Trends (INR)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Job distribution by salary band in LPA</p>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData} margin={{ top: 5, right: 10, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="band"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} label={{ position: "top", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* State-wise breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">State-wise Job Hotspots</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Technology jobs concentration across Indian states</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stateData.map((state) => {
              // Generate a consistent color based on state string hash
              let hash = 0;
              for (let i = 0; i < state.state.length; i++) {
                hash = state.state.charCodeAt(i) + ((hash << 5) - hash);
              }
              const colorIndex = Math.abs(hash) % PIE_COLORS.length;
              const color = `bg-${PIE_COLORS[colorIndex].replace('#', '')}-500`; // This is a rough approximation; better to map to actual Tailwind colors.
              // Since we don't have exact tailwind color mapping, we'll fallback to a default color.
              // For simplicity, we'll use a static color from PIE_COLORS and convert to a bg- class approximating.
              // We'll just use a default blue-500 for demonstration; in production you'd map properly.
              const bgColor = "bg-indigo-500"; // placeholder
              return (
                <div key={state.state} className="flex flex-col gap-2 p-3 rounded-xl border border-border bg-muted/20">
                  <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                  <p className="text-xs font-semibold leading-tight">{state.state}</p>
                  <p className="text-xs text-muted-foreground">{state.city ?? '-'}</p>
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div className={`${bgColor} h-1.5 rounded-full`} style={{ width: `${Math.min(state.percentage ?? 0, 100)}%` }} />
                  </div>
                  <p className="text-xs font-bold text-foreground">{state.percentage ?? 0}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartSwitcher({ value, onChange }: { value: ChartType; onChange: (t: ChartType) => void }) {
  return (
    <div className="flex items-center gap-0.5 p-1 bg-muted rounded-lg">
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
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
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