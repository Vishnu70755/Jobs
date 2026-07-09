import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button,
  Input,
  Label,
  Select,
  Separator,
} from "@/components/ui";
import {
  ArrowUpDown,
  Calendar,
  Check,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types based on our backend schema
interface EmailLog {
  id: number;
  userId: number | null;
  recipient: string;
  subject: string;
  event: string;
  status: string; // sent, failed, pending
  error: string | null;
  retryCount: number;
  sentAt: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

// Fetch email logs with pagination, search, filter
async function fetchEmailLogs(
  page: number = 1,
  limit: number = 50,
  search: string = "",
  statusFilter: string = "",
  eventFilter: string = ""
): Promise<{ emailLogs: EmailLog[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    status: statusFilter,
    event: eventFilter,
  });
  const res = await fetch(`/admin/email-logs?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch email logs");
  }
  return await res.json();
}

// Retry a failed email log
async function retryEmailLog(id: number): Promise<void> {
  const res = await fetch(`/admin/email-logs/${id}/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error("Failed to retry email");
  }
}

export default function EmailLogsPage() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  // Fetch email logs
  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchEmailLogs(page, limit, search, statusFilter, eventFilter);
      setEmailLogs(result.emailLogs);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to fetch email logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [page, limit, search, statusFilter, eventFilter]);

  // Handle retry
  const handleRetry = async (id: number) => {
    setRetryingId(id);
    try {
      await retryEmailLog(id);
      // Refetch to update status
      fetchData();
    } catch (err) {
      console.error("Failed to retry email:", err);
    } finally {
      setRetryingId(null);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1); // reset to first page when limit changes
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Email Logs</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by recipient, subject, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Status:</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "")}
              className="select sm-sm w-24"
            >
              <Select.Value placeholder="All" />
              <Select.Content>
                <Select.Item value="sent">Sent</Select.Item>
                <Select.Item value="failed">Failed</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Event:</label>
            <Select
              value={eventFilter}
              onValueChange={(value) => setEventFilter(value ?? "")}
              className="select sm-sm w-32"
            >
              <Select.Value placeholder="All Events" />
              <Select.Content>
                {/* Common events - could be fetched dynamically but hardcoded for simplicity */}
                <Select.Item value="user_registration">User Registration</Select.Item>
                <Select.Item value="user_login">User Login</Select.Item>
                <Select.Item value="job_application">Job Application</Select.Item>
                <Select.Item value="ats_analysis">ATS Analysis</Select.Item>
                <Select.Item value="interview_scheduled">Interview Scheduled</Select.Item>
                <Select.Item value="interview_reminder">Interview Reminder</Select.Item>
                <Select.Item value="interview_cancelled">Interview Cancelled</Select.Item>
                <Select.Item value="password_reset">Password Reset</Select.Item>
                <Select.Item value="admin_new_user">Admin New User</Select.Item>
                <Select.Item value="admin_login">Admin Login</Select.Item>
                <Select.Item value="admin_user_login">Admin User Login</Select.Item>
                <Select.Item value="import_started">Import Started</Select.Item>
                <Select.Item value="import_completed">Import Completed</Select.Item>
                <Select.Item value="import_failed">Import Failed</Select.Item>
                <Select.Item value="source_added">Source Added</Select.Item>
                <Select.Item value="source_updated">Source Updated</Select.Item>
                <Select.Item value="source_disabled">Source Disabled</Select.Item>
                <Select.Item value="source_enabled">Source Enabled</Select.Item>
                <Select.Item value="source_deleted">Source Deleted</Select.Item>
                <Select.Item value="daily_summary">Daily Summary</Select.Item>
                <Select.Item value="system_error">System Error</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Limit:</label>
            <Select
              value={limit}
              onValueChange={(value) => setLimit(Number(value ?? 50))}
              className="select sm-sm w-16"
            >
              <Select.Item value="25">25</Select.Item>
              <Select.Item value="50">50</Select.Item>
              <Select.Item value="100">100</Select.Item>
              <Select.Item value="200">200</Select.Item>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-muted-foreground">Total Logs</h3>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-muted-foreground">Sent</h3>
                <p className="text-2xl font-bold text-green-600">
                  {emailLogs.filter(log => log.status === "sent").length}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-muted-foreground">Failed</h3>
                <p className="text-2xl font-bold text-red-600">
                  {emailLogs.filter(log => log.status === "failed").length}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {emailLogs.filter(log => log.status === "pending").length}
                </p>
              </div>
            </div>
          </div>

          {/* Email logs table */}
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Error</th>
                  <th>Retry Count</th>
                  <th>Date & Time</th>
                  <th className="w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No email logs found.
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-accent">
                      <td>{log.recipient}</td>
                      <td title={log.subject} className="max-w-32 truncate">
                        {log.subject}
                      </td>
                      <td>
                        {/* Map event to readable label */}
                        {(() => {
                          const eventMap: Record<string, string> = {
                            user_registration: "User Registration",
                            user_login: "User Login",
                            job_application: "Job Application",
                            ats_analysis: "ATS Analysis",
                            interview_scheduled: "Interview Scheduled",
                            interview_reminder: "Interview Reminder",
                            interview_cancelled: "Interview Cancelled",
                            password_reset: "Password Reset",
                            admin_new_user: "Admin New User",
                            admin_login: "Admin Login",
                            admin_user_login: "Admin User Login",
                            import_started: "Import Started",
                            import_completed: "Import Completed",
                            import_failed: "Import Failed",
                            source_added: "Source Added",
                            source_updated: "Source Updated",
                            source_disabled": "Source Disabled",
                            source_enabled: "Source Enabled",
                            source_deleted: "Source Deleted",
                            daily_summary: "Daily Summary",
                            system_error: "System Error",
                          };
                          return eventMap[log.event] ?? log.event;
                        })()}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                log.status === "sent" ? "green.500" :
                                log.status === "failed" ? "red.500" :
                                log.status === "pending" ? "yellow.500" :
                                "gray.500"
                            }}></div>
                          <span className="text-xs capitalize">
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-40 truncate" title={log.error ?? ""}>
                        {log.error ?? "-"}
                      </td>
                      <td>{log.retryCount}</td>
                      <td>{formatDate(log.sentAt)}</td>
                      <td className="flex items-center space-x-2">
                        {log.status === "failed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(log.id)}
                            disabled={retryingId === log.id}
                            className="w-24"
                          >
                            {retryingId === log.id ? "Retrying..." : "Retry"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2 text-sm">
                Showing
                <span className="font-medium">
                  {(page - 1) * limit + 1} - {Math.min(page * limit, total)}
                </span>
                of
                <span className="font-medium">{total}</span>
                entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (page * limit < total) handlePageChange(page + 1);
                  }}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}