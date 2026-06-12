import { useState } from "react";
import {
  useListResumes,
  useCreateResume,
  useDeleteResume,
  useUpdateResume,
  getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Star, Upload, Edit2 } from "lucide-react";

export default function Resumes() {
  const { data: resumes, isLoading } = useListResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const updateResume = useUpdateResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", content: "", isDefault: false });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });

  function openAdd() {
    setForm({ name: "", content: "", isDefault: false });
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(r: { id: number; name: string; content?: string | null; isDefault?: boolean | null }) {
    setForm({ name: r.name, content: r.content ?? "", isDefault: r.isDefault ?? false });
    setEditId(r.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Resume name is required", variant: "destructive" });
      return;
    }
    if (editId) {
      updateResume.mutate(
        { id: editId, data: { name: form.name, content: form.content, isDefault: form.isDefault } },
        {
          onSuccess: () => {
            toast({ title: "Resume updated" });
            setShowAdd(false);
            invalidate();
          },
        }
      );
    } else {
      createResume.mutate(
        { data: { name: form.name, content: form.content, isDefault: form.isDefault } },
        {
          onSuccess: () => {
            toast({ title: "Resume added" });
            setShowAdd(false);
            invalidate();
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteResume.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Resume deleted" });
          invalidate();
        },
      }
    );
  }

  function handleSetDefault(id: number) {
    updateResume.mutate(
      { id, data: { isDefault: true } },
      {
        onSuccess: () => {
          toast({ title: "Set as default resume" });
          invalidate();
        },
      }
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground mt-1">Manage your resume versions.</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Resume
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : resumes?.length ? (
        <div className="space-y-4">
          {resumes.map((r) => (
            <Card key={r.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg truncate">{r.name}</p>
                    {r.isDefault && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {r.content
                      ? `${r.content.slice(0, 80)}${r.content.length > 80 ? "..." : ""}`
                      : "No content added"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(r.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!r.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Set as default"
                      onClick={() => handleSetDefault(r.id)}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No resumes yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Upload your resume to start tracking applications and running ATS analysis.
            </p>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Resume
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Resume" : "Add Resume"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rname">Resume Name</Label>
              <Input
                id="rname"
                placeholder="e.g. Software Engineer Resume v2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rcontent">Resume Content / Paste Text</Label>
              <Textarea
                id="rcontent"
                placeholder="Paste your resume text here for ATS analysis…"
                className="min-h-[180px] resize-none font-mono text-xs"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Paste your resume text so the ATS analyzer can compare it against job descriptions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rdefault"
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="rdefault" className="cursor-pointer font-normal">
                Set as default resume
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createResume.isPending || updateResume.isPending}
            >
              {editId ? "Save Changes" : "Add Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
