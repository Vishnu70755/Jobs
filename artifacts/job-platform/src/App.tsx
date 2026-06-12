import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import JobDetail from "@/pages/job-detail";
import Tracker from "@/pages/tracker";
import TrackerDetail from "@/pages/tracker-detail";
import Resumes from "@/pages/resumes";
import AtsAnalyzer from "@/pages/ats";
import Analytics from "@/pages/analytics";
import AiAssistant from "@/pages/ai";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function Home() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="absolute top-5 right-6 flex items-center gap-3">
        <a
          href="/sign-in"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign In
        </a>
        <a
          href="/admin-login"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Admin
        </a>
      </div>

      <div className="text-center space-y-6 max-w-2xl px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AI-Powered Job Search Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">JobQuest</h1>
        <p className="text-xl text-muted-foreground">
          The command center for serious job seekers. Track, analyze, and win your next role
          with precision.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <a
            href="/sign-up"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2"
          >
            Get Started Free
          </a>
          <a
            href="/sign-in"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-8 py-2"
          >
            Sign In
          </a>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 text-center">
          {[
            { n: "20+", label: "Live Jobs" },
            { n: "AI", label: "Career Assistant" },
            { n: "ATS", label: "Resume Scorer" },
          ].map((item) => (
            <div key={item.n} className="space-y-1">
              <p className="text-2xl font-bold text-primary">{item.n}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-full px-3 py-1 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Admin Access
          </div>
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with your admin-role account
          </p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/admin-login`}
          signUpUrl={`${basePath}/sign-up`}
          fallbackRedirectUrl="/admin"
        />
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/admin-login/*?" component={AdminLoginPage} />

          <Route path="/dashboard"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
          <Route path="/jobs"><ProtectedRoute><Jobs /></ProtectedRoute></Route>
          <Route path="/jobs/:id"><ProtectedRoute><JobDetail /></ProtectedRoute></Route>
          <Route path="/tracker"><ProtectedRoute><Tracker /></ProtectedRoute></Route>
          <Route path="/tracker/:id"><ProtectedRoute><TrackerDetail /></ProtectedRoute></Route>
          <Route path="/resumes"><ProtectedRoute><Resumes /></ProtectedRoute></Route>
          <Route path="/ats"><ProtectedRoute><AtsAnalyzer /></ProtectedRoute></Route>
          <Route path="/analytics"><ProtectedRoute><Analytics /></ProtectedRoute></Route>
          <Route path="/ai"><ProtectedRoute><AiAssistant /></ProtectedRoute></Route>
          <Route path="/notifications"><ProtectedRoute><Notifications /></ProtectedRoute></Route>
          <Route path="/profile"><ProtectedRoute><Profile /></ProtectedRoute></Route>
          <Route path="/admin"><ProtectedRoute><Admin /></ProtectedRoute></Route>

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="jobquest-theme">
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
