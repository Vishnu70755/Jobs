import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-600",
  error: "bg-red-500/10 text-red-500",
};

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications({});
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
  }

  function handleMarkRead(id: number) {
    markRead.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
        },
      }
    );
  }

  function handleMarkAll() {
    markAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "All notifications marked as read" });
        invalidate();
      },
    });
  }

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications?.length ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "transition-colors",
                !n.isRead && "border-primary/30 bg-primary/5"
              )}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    TYPE_COLORS[(n as any).type ?? "info"]
                  )}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", !n.isRead && "font-semibold")}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  {(n as any).message && (
                    <p className="text-sm text-muted-foreground mt-0.5">{(n as any).message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date((n as any).createdAt ?? Date.now()).toLocaleString()}
                  </p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-xs"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              You are all caught up. Notifications will appear here when there is something new.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
