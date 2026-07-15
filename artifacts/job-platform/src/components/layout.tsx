import React from "react";
 
 
import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { MessageSquare, Menu } from "lucide-react";
import { Link } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — always visible on md+, drawer on mobile */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 md:relative md:block md:translate-x-0 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        {/* Mobile top bar with hamburger */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-30" aria-label="App header">
          <button
            onClick={openSidebar}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-primary tracking-tight">JobQuest</h1>
        </header>

        {children}
      </main>

      {/* AI Chat FAB */}
      <Link href="/ai" aria-label="Open AI chat assistant">
        <div className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer z-40">
          <MessageSquare className="w-6 h-6" />
        </div>
      </Link>
    </div>
  );
}
