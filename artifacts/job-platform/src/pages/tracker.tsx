import { useGetApplicationBoard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Tracker() {
  const { data: board, isLoading } = useGetApplicationBoard();

  return (
    <div className="p-8 h-full flex flex-col min-h-0 w-full overflow-hidden">
      <div className="flex-none mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
        <p className="text-muted-foreground mt-1">Manage your job applications.</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-80 flex flex-col gap-4 flex-none">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            ))
          ) : board?.columns?.length ? (
            board.columns.map((column) => (
              <div key={column.status} className="w-80 flex flex-col gap-4 flex-none h-full max-h-full">
                <div className="flex items-center justify-between bg-card border border-border px-4 py-2.5 rounded-lg shadow-sm">
                  <h3 className="font-semibold">{column.label}</h3>
                  <Badge variant="secondary" className="font-mono">{column.count || 0}</Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {column.applications?.map(app => (
                    <Link key={app.id} href={`/tracker/${app.id}`}>
                      <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                        <CardContent className="p-4 space-y-2">
                          <div>
                            <p className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">{app.role}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{app.company}</p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-muted-foreground">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Draft'}
                            </span>
                            {app.source && (
                              <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                                {app.source}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {(!column.applications || column.applications.length === 0) && (
                    <div className="p-4 border border-dashed border-border rounded-xl text-center text-muted-foreground text-sm">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-20 text-muted-foreground">
              No applications tracked yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
