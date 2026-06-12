import { Sidebar } from "./sidebar";
import { MessageSquare } from "lucide-react";
import { Link } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {children}
        
        <Link href="/ai">
          <div className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer z-50">
            <MessageSquare className="w-6 h-6" />
          </div>
        </Link>
      </main>
    </div>
  );
}
