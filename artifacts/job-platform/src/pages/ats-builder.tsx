import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download, Eye, FileText, X } from "lucide-react";

interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  location: string;
  bullets: string[];
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function buildResumeHTML(data: ResumeData): string {
  const { contact, summary, experiences, education, skills, certifications } = data;
  const skillList = skills.filter(Boolean);

  const expHTML = experiences.map((e) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div>
          <strong style="font-size:14px">${e.role}</strong>
          <span style="color:#555"> · ${e.company}</span>
          ${e.location ? `<span style="color:#777;font-size:12px"> — ${e.location}</span>` : ""}
        </div>
        <span style="font-size:12px;color:#777;white-space:nowrap">${e.startDate}${e.startDate && (e.endDate || "Present") ? " – " + (e.endDate || "Present") : ""}</span>
      </div>
      <ul style="margin:6px 0 0 18px;padding:0">
        ${e.bullets.filter(Boolean).map((b) => `<li style="margin-bottom:3px;font-size:13px;color:#333">${b}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const eduHTML = education.map((e) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div>
          <strong style="font-size:14px">${e.school}</strong>
          ${e.degree ? `<span style="color:#555"> · ${e.degree}${e.field ? " in " + e.field : ""}</span>` : ""}
        </div>
        <span style="font-size:12px;color:#777">${e.startDate}${e.startDate && (e.endDate || "Present") ? " – " + (e.endDate || "Present") : ""}</span>
      </div>
      ${e.gpa ? `<p style="font-size:12px;color:#666;margin:2px 0 0">GPA: ${e.gpa}</p>` : ""}
    </div>
  `).join("");

  const certHTML = certifications.filter(Boolean).map((c) => `<li style="font-size:13px;margin-bottom:2px">${c}</li>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${contact.name} — Resume</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; background: white; line-height: 1.5; }
  .page { max-width: 750px; margin: 0 auto; padding: 40px 44px; }
  h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
  .contact-line { font-size: 12.5px; color: #555; margin-top: 4px; }
  .section { margin-top: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #444; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 3px; margin-bottom: 10px; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #f0f0f0; padding: 3px 10px; border-radius: 3px; font-size: 12px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 32px; }
  }
</style>
</head>
<body>
<div class="page">
  <h1>${contact.name || "Your Name"}</h1>
  <div class="contact-line">
    ${[contact.email, contact.phone, contact.location, contact.linkedin, contact.website].filter(Boolean).join(" &nbsp;|&nbsp; ")}
  </div>

  ${summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p style="font-size:13px;color:#333">${summary}</p>
  </div>` : ""}

  ${experiences.some(e => e.company || e.role) ? `
  <div class="section">
    <div class="section-title">Experience</div>
    ${expHTML}
  </div>` : ""}

  ${education.some(e => e.school) ? `
  <div class="section">
    <div class="section-title">Education</div>
    ${eduHTML}
  </div>` : ""}

  ${skillList.length ? `
  <div class="section">
    <div class="section-title">Skills</div>
    <div class="skills-list">
      ${skillList.map(s => `<span class="skill-tag">${s}</span>`).join("")}
    </div>
  </div>` : ""}

  ${certHTML ? `
  <div class="section">
    <div class="section-title">Certifications & Awards</div>
    <ul style="margin-left:18px">${certHTML}</ul>
  </div>` : ""}
</div>
</body>
</html>`;
}

interface ResumeData {
  contact: { name: string; email: string; phone: string; location: string; linkedin: string; website: string };
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[];
}

const defaultData: ResumeData = {
  contact: { name: "", email: "", phone: "", location: "", linkedin: "", website: "" },
  summary: "",
  experiences: [{ id: uid(), company: "", role: "", startDate: "", endDate: "", location: "", bullets: ["", ""] }],
  education: [{ id: uid(), school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" }],
  skills: [""],
  certifications: [""],
};

export default function AtsBuilder() {
  const [data, setData] = useState<ResumeData>(defaultData);
  const [showPreview, setShowPreview] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  function setContact(key: keyof typeof data.contact, val: string) {
    setData(d => ({ ...d, contact: { ...d.contact, [key]: val } }));
  }

  function addExperience() {
    setData(d => ({
      ...d,
      experiences: [...d.experiences, { id: uid(), company: "", role: "", startDate: "", endDate: "", location: "", bullets: ["", ""] }],
    }));
  }

  function removeExperience(id: string) {
    setData(d => ({ ...d, experiences: d.experiences.filter(e => e.id !== id) }));
  }

  function updateExp(id: string, key: keyof Experience, val: any) {
    setData(d => ({ ...d, experiences: d.experiences.map(e => e.id === id ? { ...e, [key]: val } : e) }));
  }

  function updateExpBullet(id: string, idx: number, val: string) {
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e => {
        if (e.id !== id) return e;
        const bullets = [...e.bullets];
        bullets[idx] = val;
        return { ...e, bullets };
      }),
    }));
  }

  function addBullet(id: string) {
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ""] } : e),
    }));
  }

  function removeBullet(id: string, idx: number) {
    setData(d => ({
      ...d,
      experiences: d.experiences.map(e => e.id === id ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) } : e),
    }));
  }

  function addEducation() {
    setData(d => ({
      ...d,
      education: [...d.education, { id: uid(), school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" }],
    }));
  }

  function removeEducation(id: string) {
    setData(d => ({ ...d, education: d.education.filter(e => e.id !== id) }));
  }

  function updateEdu(id: string, key: keyof Education, val: string) {
    setData(d => ({ ...d, education: d.education.map(e => e.id === id ? { ...e, [key]: val } : e) }));
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    setData(d => ({ ...d, skills: [...d.skills.filter(Boolean), s] }));
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setData(d => ({ ...d, skills: d.skills.filter(sk => sk !== s) }));
  }

  function handleDownload() {
    const html = buildResumeHTML(data);
    const win = window.open("", "_blank", "width=960,height=800");
    if (!win) {
      alert("Please allow pop-ups in your browser to download the resume.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
    setTimeout(() => { if (!win.closed) { win.focus(); win.print(); } }, 800);
  }

  function handlePreview() {
    setShowPreview(true);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ATS Resume Builder</h1>
          <p className="text-muted-foreground mt-1">Build an ATS-friendly resume and download as PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePreview}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button className="gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Contact */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["name","email","phone","location","linkedin","website"] as const).map((k) => (
            <div key={k} className="space-y-1.5">
              <Label className="capitalize">{k === "linkedin" ? "LinkedIn URL" : k === "website" ? "Website / Portfolio" : k}</Label>
              <Input
                placeholder={k === "name" ? "Vishnu" : k === "email" ? "mail@example.com" : k === "phone" ? "+91 9876543210" : k === "location" ? "India" : k === "linkedin" ? "linkedin.com/in/vishnu" : "github.com/vishnu"}
                value={data.contact[k]}
                onChange={(e) => setContact(k, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Professional Summary</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications…"
            className="min-h-[100px] resize-none"
            value={data.summary}
            onChange={(e) => setData(d => ({ ...d, summary: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1.5">3–5 sentences. Focus on your biggest strengths and measurable achievements.</p>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Work Experience</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addExperience}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.experiences.map((exp, ei) => (
            <div key={exp.id} className="border border-border rounded-xl p-4 space-y-3 relative">
              {data.experiences.length > 1 && (
                <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Job Title *</Label>
                  <Input placeholder="Senior Software Engineer" value={exp.role} onChange={e => updateExp(exp.id, "role", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Company *</Label>
                  <Input placeholder="Acme Corp" value={exp.company} onChange={e => updateExp(exp.id, "company", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input placeholder="Jan 2022" value={exp.startDate} onChange={e => updateExp(exp.id, "startDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input placeholder="Present" value={exp.endDate} onChange={e => updateExp(exp.id, "endDate", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Location</Label>
                  <Input placeholder="San Francisco, CA (Remote)" value={exp.location} onChange={e => updateExp(exp.id, "location", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bullet Points <span className="text-muted-foreground text-xs">(use metrics — "Increased performance by 40%")</span></Label>
                {exp.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <Input
                      placeholder="• Led migration to microservices, reducing API latency by 60%"
                      value={b}
                      onChange={e => updateExpBullet(exp.id, bi, e.target.value)}
                    />
                    {exp.bullets.length > 1 && (
                      <button onClick={() => removeBullet(exp.id, bi)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => addBullet(exp.id)}>
                  <Plus className="w-3 h-3" /> Add bullet
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Education</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addEducation}>
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.education.map((edu) => (
            <div key={edu.id} className="border border-border rounded-xl p-4 space-y-3 relative">
              {data.education.length > 1 && (
                <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>School / University</Label>
                  <Input placeholder="MIT" value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Degree</Label>
                  <Input placeholder="Bachelor of Science" value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Field of Study</Label>
                  <Input placeholder="Computer Science" value={edu.field} onChange={e => updateEdu(edu.id, "field", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Year</Label>
                  <Input placeholder="2018" value={edu.startDate} onChange={e => updateEdu(edu.id, "startDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Year</Label>
                  <Input placeholder="2022" value={edu.endDate} onChange={e => updateEdu(edu.id, "endDate", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>GPA (optional)</Label>
                  <Input placeholder="3.8" value={edu.gpa} onChange={e => updateEdu(edu.id, "gpa", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g. React, Python, AWS)…"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <Button variant="outline" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
          </div>
          {data.skills.filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.skills.filter(Boolean).map(s => (
                <Badge key={s} variant="secondary" className="gap-1.5 pr-1.5">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Certifications & Awards</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setData(d => ({ ...d, certifications: [...d.certifications, ""] }))}>
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.certifications.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="AWS Solutions Architect – Associate (2023)"
                value={c}
                onChange={e => setData(d => ({ ...d, certifications: d.certifications.map((x, j) => j === i ? e.target.value : x) }))}
              />
              {data.certifications.length > 1 && (
                <button onClick={() => setData(d => ({ ...d, certifications: d.certifications.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" className="gap-2" onClick={handlePreview}>
          <Eye className="w-4 h-4" /> Preview
        </Button>
        <Button className="gap-2" onClick={handleDownload}>
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Resume Preview</h2>
              <div className="flex gap-2">
                <Button size="sm" className="gap-2" onClick={handleDownload}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <iframe
                srcDoc={buildResumeHTML(data)}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "600px", background: "white" }}
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
