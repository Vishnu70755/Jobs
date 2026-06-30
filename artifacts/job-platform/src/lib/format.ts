// Indian formatting utilities — currency, dates, times in IST

const IST = "Asia/Kolkata";

// ─── Currency ─────────────────────────────────────────────────────────────────

/** Convert raw amount to ₹ LPA / ₹ Cr PA display.
 *  currency = "INR" → raw rupees stored in DB (e.g. 1800000 = ₹18 LPA)
 *  currency = "USD" → convert at ~₹83/$ then show LPA/CrPA */
export function formatINR(
  amount: number | null | undefined,
  currency: string = "USD"
): string | null {
  if (amount == null || amount <= 0) return null;

  const rupees = currency === "INR" ? amount : amount * 83;
  const lpa = rupees / 100_000;

  if (lpa >= 100) {
    const cr = lpa / 100;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)} Cr PA`;
  }
  if (lpa >= 1) {
    return `₹${lpa % 1 === 0 ? lpa.toFixed(0) : lpa.toFixed(1)} LPA`;
  }
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

/** Format a salary range: "₹18–24 LPA" or "₹1.5 Cr PA" */
export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency = "USD"
): string | null {
  if (!min && !max) return null;
  const fMin = min ? formatINR(min, currency) : null;
  const fMax = max ? formatINR(max, currency) : null;
  if (!fMin) return fMax;
  if (!fMax) return fMin;
  // If both are LPA, merge: ₹18–24 LPA
  const isLpa = fMin.includes("LPA") && fMax.includes("LPA");
  if (isLpa) {
    const minVal = fMin.replace("₹", "").replace(" LPA", "");
    const maxVal = fMax.replace("₹", "").replace(" LPA", "");
    return `₹${minVal}–${maxVal} LPA`;
  }
  return `${fMin} – ${fMax}`;
}

/** Format an offered salary (single number) */
export function formatOfferedSalary(amount: number | null | undefined): string {
  if (!amount) return "—";
  const lpa = amount / 100_000;
  if (lpa >= 100) return `₹${(lpa / 100).toFixed(1)} Cr PA`;
  if (lpa >= 1) return `₹${lpa.toFixed(lpa % 1 === 0 ? 0 : 1)} LPA`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// ─── Dates & Times ────────────────────────────────────────────────────────────

/** DD/MM/YYYY */
export function formatIndianDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: IST,
  }); // en-GB gives DD/MM/YYYY
}

/** DD/MM/YYYY, HH:MM AM/PM IST */
export function formatISTDatetime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const datePart = formatIndianDate(d);
  const timePart = d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: IST,
  }).toUpperCase();
  return `${datePart}, ${timePart} IST`;
}

/** HH:MM AM/PM IST */
export function formatISTTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: IST,
  }).toUpperCase() + " IST";
}

/** Relative time with Indian date fallback */
export function timeAgoIN(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatIndianDate(d);
}

// ─── Google Calendar URL (IST timezone) ──────────────────────────────────────

interface CalendarEventParams {
  title: string;
  start: string;         // datetime-local value "YYYY-MM-DDTHH:MM"
  durationMins?: number; // default 60
  company: string;
  role: string;
  mode?: "online" | "offline" | "telephonic";
  meetingLink?: string;
  location?: string;
  notes?: string;
  recruiterEmail?: string;
}

/** Build Google Calendar "Add to Calendar" URL with IST timezone.
 *  Google interprets the dates param in the ctz timezone when ctz is provided. */
export function buildGoogleCalendarUrl(params: CalendarEventParams): string {
  const startDt = new Date(params.start);
  const durationMs = (params.durationMins ?? 60) * 60 * 1000;
  const endDt = new Date(startDt.getTime() + durationMs);

  // Format as YYYYMMDDTHHMMSS (local time; Google will interpret in ctz=Asia/Kolkata)
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `T${pad(d.getHours())}${pad(d.getMinutes())}00`
    );
  };

  const modeLabel =
    params.mode === "online" ? "💻 Online Interview" :
    params.mode === "telephonic" ? "📞 Telephonic Interview" :
    params.mode === "offline" ? "🏢 In-Person Interview" : "";

  const eventLocation =
    params.meetingLink ??
    params.location ??
    (params.mode === "online" ? "Online (see invite)" : "In-person (see invite)");

  const lines = [
    `🏢 Company: ${params.company}`,
    `💼 Role: ${params.role}`,
    modeLabel,
    params.meetingLink ? `🔗 Meeting Link: ${params.meetingLink}` : "",
    params.recruiterEmail ? `📧 Recruiter: ${params.recruiterEmail}` : "",
    params.notes ? `\n📝 Notes & Prep Tips:\n${params.notes}` : "",
    `\n⏰ Time: IST (Asia/Kolkata)`,
    `✅ Scheduled via JobQuest`,
  ].filter(Boolean).join("\n");

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${fmt(startDt)}/${fmt(endDt)}`);
  url.searchParams.set("details", lines);
  url.searchParams.set("location", eventLocation);
  url.searchParams.set("ctz", "Asia/Kolkata");
  return url.toString();
}
