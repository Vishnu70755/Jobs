import React from "react";
 
import { useState, useRef } from "react";
import {
  useListResumes,
  useCreateResume,
  useDeleteResume,
  useUpdateResume,
  getListResumesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Trash2, Star, Upload, Edit2, File, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Resumes() {
  const { data: resumes, isLoading } = useListResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const updateResume = useUpdateResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", isDefault: false });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [dragging, setDragging] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });

  function openAdd() {
    setForm({ name: "", isDefault: false });
    setSelectedFile(null);
    setFileContent("");
    setEditId(null);
    setShowAdd(true);
  }

  function openEdit(r: { id: number; name: string; content?: string | null; isDefault?: boolean | null }) {
    setForm({ name: r.name, isDefault: r.isDefault ?? false });
    setSelectedFile(null);
    setFileContent(r.content ?? "");
    setEditId(r.id);
    setShowAdd(true);
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) ?? "");
      reader.readAsText(file);
    });
  }

  async function handleFileSelect(file: File) {
    const allowed = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      toast({ title: "Unsupported file type", description: "Please upload a PDF, Word, or text file.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    // Auto-fill name from filename if empty
    if (!form.name) {
      setForm(f => ({ ...f, name: file.name.replace(/\.(pdf|doc|docx|txt)$/i, "") }));
    }
    // For text files, read content for ATS analysis
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await readFileAsText(file);
      setFileContent(text);
    } else {
      // For PDF/Word we store the filename as a placeholder for content
      setFileContent(`[File: ${file.name}]`);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Resume name is required", variant: "destructive" });
      return;
    }
    const fileType = selectedFile?.type ?? null;
    const fileName = selectedFile?.name ?? null;

    if (editId) {
      updateResume.mutate(
        {
          id: editId,
          data: {
            name: form.name,
            content: fileContent || undefined,
            isDefault: form.isDefault,
            ...(fileName ? { fileUrl: fileName, fileType } : {}),
          } as any,
        },
        {
          onSuccess: () => { toast({ title: "Resume updated" }); setShowAdd(false); invalidate(); },
        }
      );
    } else {
      createResume.mutate(
        {
          data: {
            name: form.name,
            content: fileContent,
            isDefault: form.isDefault,
            ...(fileName ? { fileUrl: fileName, fileType } : {}),
          } as any,
        },
        {
          onSuccess: () => { toast({ title: "Resume uploaded!" }); setShowAdd(false); invalidate(); },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteResume.mutate({ id }, {
      onSuccess: () => { toast({ title: "Resume deleted" }); invalidate(); },
    });
  }

  function handleSetDefault(id: number) {
    updateResume.mutate({ id, data: { isDefault: true } }, {
      onSuccess: () => { toast({ title: "Set as default resume" }); invalidate(); },
    });
  }

  function getFileIcon(r: any) {
    const url: string = r.fileUrl ?? "";
    if (url.match(/\.pdf$/i)) return <FileType className="w-6 h-6 text-red-500" />;
    if (url.match(/\.docx?$/i)) return <FileType className="w-6 h-6 text-blue-500" />;
    return <FileText className="w-6 h-6 text-primary" />;
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your resume versions.</p>
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
                  {getFileIcon(r)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-lg truncate">{r.name}</p>
                    {r.isDefault && (
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">Default</Badge>
                    )}
                    {(r as any).fileUrl && (
                      <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                        {(r as any).fileUrl.split(".").pop()?.toUpperCase() ?? "FILE"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {(r as any).fileUrl
                      ? (r as any).fileUrl
                      : r.content
                        ? `${r.content.slice(0, 80)}${r.content.length > 80 ? "…" : ""}`
                        : "No file uploaded"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(r.createdAt!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!r.isDefault && (
                    <Button variant="ghost" size="icon" title="Set as default" onClick={() => handleSetDefault(r.id)}>
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r as any)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
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
              Upload a PDF or Word file to start tracking applications and running ATS analysis.
            </p>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Your First Resume
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Resume" : "Upload Resume"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rname">Resume Name *</Label>
              <Input
                id="rname"
                placeholder="e.g. Software Engineer Resume v2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* File upload area */}
            <div className="space-y-1.5">
              <Label>Resume File</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                  dragging
                    ? "border-primary bg-primary/5"
                    : selectedFile
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <File className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-medium text-sm text-emerald-600">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Drop your file here or click to browse</p>
                    <p className="text-xs text-muted-foreground">PDF, Word (.doc, .docx), or plain text</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = "";
                  }}
                />
              </div>
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
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createResume.isPending || updateResume.isPending}
            >
              {editId ? "Save Changes" : "Upload Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
