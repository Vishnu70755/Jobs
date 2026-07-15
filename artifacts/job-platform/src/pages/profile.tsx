import React from "react";
 
import { useState, useEffect } from "react";
import {
  useGetMyProfile,
  useUpdateMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  User, Briefcase, MapPin, Link2, Github, Globe, Phone,
  Calendar, Edit3, Save, X, Plus, CheckCircle2, AlertCircle,
  Sparkles, Bookmark, FileText,
} from "lucide-react";

const EXPERIENCE_OPTIONS = ["0-1 years", "1-2 years", "2-5 years", "5-10 years", "10+ years"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "Go", "Rust",
  "SQL", "PostgreSQL", "MongoDB", "AWS", "GCP", "Azure", "Docker", "Kubernetes",
  "Git", "REST", "GraphQL", "CSS", "HTML", "Vue", "Angular", "Swift", "Kotlin",
  "TailwindCSS", "Redis", "Next.js", "Spring Boot", "Django", "FastAPI",
];

type Tab = "personal" | "professional" | "skills";

// ─── Circular SVG completion ring with % text inside ────────────────────────
function CompletionRing({
  pct,
  size = 120,
  stroke = 8,
  imageUrl,
  name,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  imageUrl?: string;
  name?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  const color =
    pct >= 100 ? "#10b981" :
    pct >= 50  ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* % label inside the ring, below the avatar */}
        <text
          x={cx}
          y={size - 6}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={color}
        >
          {pct}%
        </text>
      </svg>
      {/* Avatar inside ring */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || "Avatar"}
          className="rounded-full object-cover"
          style={{ width: size - stroke * 3.5, height: size - stroke * 3.5 }}
        />
      ) : (
        <div
          className="rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold"
          style={{ width: size - stroke * 3.5, height: size - stroke * 3.5, fontSize: size / 3.5 }}
        >
          {(name || "?")[0].toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─── Field checklist badge ───────────────────────────────────────────────────
function FieldBadge({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
      filled
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "border-border bg-muted text-muted-foreground"
    }`}>
      {filled ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3 opacity-50" />}
      {label}
    </span>
  );
}

// ─── SkillTag ────────────────────────────────────────────────────────────────
function SkillTag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-destructive transition-colors ml-0.5">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ─── Tab button ─────────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-t-md border-b-2 transition-colors whitespace-nowrap ${
        active
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Profile completion fields definition ────────────────────────────────────
const COMPLETION_FIELDS = [
  { key: "name",        label: "Full Name" },
  { key: "email",       label: "Email" },
  { key: "photo",       label: "Photo" },
  { key: "title",       label: "Job Title" },
  { key: "location",    label: "Location" },
  { key: "phone",       label: "Phone" },
  { key: "bio",         label: "Bio" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "gender",      label: "Gender" },
  { key: "portfolio",   label: "Portfolio" },
  { key: "experience",  label: "Experience" },
  { key: "targetRole",  label: "Target Role" },
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "githubUrl",   label: "GitHub" },
  { key: "skills",      label: "Skills" },
];

export default function Profile() {
  const { user: clerkUser } = useUser();
  const { data: profile, isLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("personal");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    location: "",
    phone: "",
    bio: "",
    dateOfBirth: "",
    gender: "",
    profile: "",
    experience: "",
    targetRole: "",
    linkedinUrl: "",
    githubUrl: "",
    skills: [] as string[],
    role: "",
    resumeUrl: "",
    resumeFileName: "",
    savedJobsCount: 0,
    trackedJobsCount: 0,
  });
  const [skillInput, setSkillInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Populate form once data is loaded
  useEffect(() => {
    if (profile && clerkUser && !initialized) {
      setForm({
        name: (profile.name || clerkUser.fullName) ?? "",
        title: profile.title ?? "",
        location: profile.location ?? "",
        phone: (profile as any).phone ?? "",
        bio: (profile as any).bio ?? "",
        dateOfBirth: (profile as any).dateOfBirth ?? "",
        gender: (profile as any).gender ?? "",
        portfolio: (profile as any).profile ?? "",
        experience: profile.experience ?? "",
        targetRole: profile.targetRole ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        skills: (profile.skills as string[]) ?? [],
        role: (profile as any).role ?? "",
        resumeUrl: profile.resumeUrl ?? "",
        resumeFileName: profile.resumeFileName ?? "",
        savedJobsCount: profile.savedJobsCount ?? 0,
        trackedJobsCount: profile.trackedJobsCount ?? 0,
      });
      setInitialized(true);
    }
  }, [profile, clerkUser, initialized]);

  // Completion calculation
  const pctData = {
    name:        !!(form.name || clerkUser?.fullName),
    email:       !!clerkUser?.primaryEmailAddress?.emailAddress,
    photo:       !!clerkUser?.imageUrl,
    title:       !!form.title,
    location:    !!form.location,
    phone:       !!form.phone,
    bio:         !!form.bio,
    dateOfBirth: !!form.dateOfBirth,
    gender:      !!form.gender,
    portfolio:   !!form.portfolio,
    experience:  !!form.experience,
    targetRole:  !!form.targetRole,
    linkedinUrl: !!form.linkedinUrl,
    githubUrl:   !!form.githubUrl,
    skills:      form.skills.length > 0,
  };
  const filledCount = Object.values(pctData).filter(Boolean).length;
  const completionPct = Math.round((filledCount / COMPLETION_FIELDS.length) * 100);

  const ringColor =
    completionPct >= 100 ? "text-emerald-600 dark:text-emerald-400" :
    completionPct >= 50  ? "text-amber-600 dark:text-amber-400"    : "text-red-500";

  const statusLabel =
    completionPct >= 100 ? "Profile Complete" :
    completionPct >= 50  ? "Almost There"     : "Profile Incomplete";

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addSkill(skill: string) {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== skill) }));
  }

  function cancelEdit() {
    // Reset to saved data
    if (profile) {
      setForm({
        name: (profile.name || clerkUser?.fullName) ?? "",
        title: profile.title ?? "",
        location: profile.location ?? "",
        phone: (profile as any).phone ?? "",
        bio: (profile as any).bio ?? "",
        dateOfBirth: (profile as any).dateOfBirth ?? "",
        gender: (profile as any).gender ?? "",
        portfolio: (profile as any).portfolio ?? "",
        experience: profile.experience ?? "",
        targetRole: profile.targetRole ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        skills: (profile.skills as string[]) ?? [],
      });
    }
    setEditMode(false);
  }

  async function handleSave() {
    try {
      await updateProfile.mutateAsync({ data: form as any });
      await queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      setEditMode(false);
      toast({ title: "Profile saved", description: "Your changes have been saved." });
    } catch {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    }
  }

  if (isLoading || !initialized) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Keep your profile complete to attract better opportunities.</p>
      </div>

      {/* Profile card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14">
            {/* Avatar + ring */}
            <CompletionRing
              pct={completionPct}
              size={100}
              stroke={7}
              imageUrl={clerkUser?.imageUrl}
              name={form.name || clerkUser?.fullName || "?"}
            />

            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-bold">
                {form.name || clerkUser?.fullName || "Your Name"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {form.title || "No title set"} {form.location ? `· ${form.location}` : ""}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-semibold ${ringColor}`}>{statusLabel}</span>
                <span className="text-xs text-muted-foreground">({completionPct}% complete)</span>
              </div>
            </div>

            {/* Additional profile information */}
            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Role:</span>
                    <span className="ml-2">{form.role || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Joined:</span>
                      <span className="ml-2">{clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Resume:</span>
                      <span className="ml-2">{form.resumeCount > 0 ? 'Available' : 'Not set'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4" />
                      <span className="font-medium">Saved Jobs:</span>
                      <span className="ml-2">{form.savedJobsCount}</span>
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span className="font-medium">Tracked Jobs:</span>
                      <span className="ml-2">{form.applicationCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit / Save */}
            <div className="flex gap-2 flex-shrink-0">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {updateProfile.isPending ? "Saving…" : "Save"}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setEditMode(true)}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Completion checklist */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {COMPLETION_FIELDS.map((f) => (
              <FieldBadge key={f.key} label={f.label} filled={pctData[f.key as keyof typeof pctData]} />
            ))}
          </div>

          {/* Additional profile information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium">Resume</span>
              </div>
              <p className="text-sm">
                {form.resumeFileName ? (
                  <a href={form.resumeUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {form.resumeFileName}
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">Saved Jobs</span>
              </div>
              <p className="text-sm">{form.savedJobsCount ?? 0}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5" />
                <span className="font-medium">Tracked Jobs</span>
              </div>
              <p className="text-sm">{form.trackedJobsCount ?? 0}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Member since</span>
              </div>
              <p className="text-sm">
                {clerkUser?.createdAt ? new Date(clerkUser.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border px-4 pt-2 overflow-x-auto">
          <TabBtn active={tab === "personal"} onClick={() => setTab("personal")}>
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Personal</span>
          </TabBtn>
          <TabBtn active={tab === "professional"} onClick={() => setTab("professional")}>
            <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Professional</span>
          </TabBtn>
          <TabBtn active={tab === "skills"} onClick={() => setTab("skills")}>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Skills</span>
          </TabBtn>
        </div>

        <CardContent className="pt-5 pb-6 space-y-5">

          {/* ── PERSONAL TAB ── */}
          {tab === "personal" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  {editMode ? (
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your full name" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.name || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
                  </Label>
                  {editMode ? (
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 9876543210" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.phone || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="text-sm text-foreground min-h-[36px] flex items-center gap-1.5 text-muted-foreground">
                    {clerkUser?.primaryEmailAddress?.emailAddress}
                    <Badge variant="secondary" className="text-xs">from Clerk</Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location
                  </Label>
                  {editMode ? (
                    <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Bangalore, India" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.location || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date of Birth
                  </Label>
                  {editMode ? (
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.dateOfBirth || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  {editMode ? (
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.gender || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio — full width */}
              <div className="space-y-1.5">
                <Label>Bio / About Me</Label>
                {editMode ? (
                  <Textarea
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Write a short bio about yourself, your background, and career goals…"
                    className="min-h-[100px] resize-none"
                  />
                ) : (
                  <p className="text-sm text-foreground min-h-[36px]">
                    {form.bio || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── PROFESSIONAL TAB ── */}
          {tab === "professional" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Current Job Title
                  </Label>
                  {editMode ? (
                    <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Senior Frontend Developer" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.title || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Years of Experience</Label>
                  {editMode ? (
                    <select
                      value={form.experience}
                      onChange={(e) => set("experience", e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select experience</option>
                      {EXPERIENCE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.experience || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Target Role</Label>
                  {editMode ? (
                    <Input value={form.targetRole} onChange={(e) => set("targetRole", e.target.value)} placeholder="e.g. Full Stack Engineer at a startup" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.targetRole || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Portfolio URL
                  </Label>
                  {editMode ? (
                    <Input value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="https://yourportfolio.dev" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.portfolio
                        ? <a href={form.portfolio} target="_blank" rel="noreferrer" className="text-primary hover:underline">{form.portfolio}</a>
                        : <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> LinkedIn URL
                  </Label>
                  {editMode ? (
                    <Input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/yourname" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.linkedinUrl
                        ? <a href={form.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{form.linkedinUrl}</a>
                        : <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-muted-foreground" /> GitHub URL
                  </Label>
                  {editMode ? (
                    <Input value={form.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/yourname" />
                  ) : (
                    <p className="text-sm text-foreground min-h-[36px] flex items-center">
                      {form.githubUrl
                        ? <a href={form.githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{form.githubUrl}</a>
                        : <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SKILLS TAB ── */}
          {tab === "skills" && (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Your Skills ({form.skills.length})</Label>
                {form.skills.length === 0 && (
                  <p className="text-sm text-muted-foreground italic mb-3">No skills added yet.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <SkillTag key={s} label={s} onRemove={editMode ? () => removeSkill(s) : undefined} />
                  ))}
                </div>
              </div>

              {editMode && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                      placeholder="Type a skill and press Enter…"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={() => addSkill(skillInput)}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Quick add common skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((s) => (
                        <button
                          key={s}
                          onClick={() => addSkill(s)}
                          className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary hover:text-primary transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
