import { useState, useEffect } from "react";
import {
  useGetMyProfile,
  useUpdateMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Briefcase, MapPin, Link2, Github, X, Plus } from "lucide-react";

const EXPERIENCE_OPTIONS = ["0-1 years", "1-2 years", "2-5 years", "5-10 years", "10+ years"];
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "Go", "Rust",
  "SQL", "PostgreSQL", "MongoDB", "AWS", "GCP", "Azure", "Docker", "Kubernetes",
  "Git", "REST", "GraphQL", "CSS", "HTML", "Vue", "Angular", "Swift", "Kotlin",
];

export default function Profile() {
  const { user: clerkUser } = useUser();
  const { data: profile, isLoading } = useGetMyProfile();
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    title: "",
    location: "",
    experience: "",
    targetRole: "",
    linkedinUrl: "",
    githubUrl: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? clerkUser?.fullName ?? "",
        title: profile.title ?? "",
        location: profile.location ?? "",
        experience: profile.experience ?? "",
        targetRole: profile.targetRole ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        skills: (profile.skills as string[]) ?? [],
      });
    }
  }, [profile, clerkUser]);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function addSkill(skill: string) {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    update("skills", [...form.skills, s]);
    setSkillInput("");
  }

  function removeSkill(s: string) {
    update("skills", form.skills.filter((sk) => sk !== s));
  }

  function handleSave() {
    updateProfile.mutate(
      { data: form as any },
      {
        onSuccess: () => {
          toast({ title: "Profile updated" });
          setDirty(false);
          queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to save", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto w-full pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your career profile and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" /> Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            {clerkUser?.imageUrl && (
              <img
                src={clerkUser.imageUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium">{clerkUser?.fullName || "No name set"}</p>
              <p className="text-sm text-muted-foreground">
                {clerkUser?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Full Name</Label>
              <Input
                id="pname"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ptitle">Job Title</Label>
              <Input
                id="ptitle"
                placeholder="Senior Frontend Engineer"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plocation">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="plocation"
                  placeholder="San Francisco, CA"
                  className="pl-9"
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pexperience">Years of Experience</Label>
              <select
                id="pexperience"
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select…</option>
                {EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="w-4 h-4" /> Career Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ptarget">Target Role</Label>
            <Input
              id="ptarget"
              placeholder="e.g. Staff Software Engineer, Product Manager"
              value={form.targetRole}
              onChange={(e) => update("targetRole", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
          <CardDescription>Add the skills you want to highlight to employers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g. React, Python)…"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
            />
            <Button variant="outline" onClick={() => addSkill(skillInput)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1.5 pr-1.5">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4" /> Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="plinkedin">LinkedIn URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="plinkedin"
                placeholder="https://linkedin.com/in/your-profile"
                className="pl-9"
                value={form.linkedinUrl}
                onChange={(e) => update("linkedinUrl", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pgithub">GitHub URL</Label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="pgithub"
                placeholder="https://github.com/your-username"
                className="pl-9"
                value={form.githubUrl}
                onChange={(e) => update("githubUrl", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={!dirty || updateProfile.isPending} size="lg">
          {updateProfile.isPending ? "Saving…" : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
