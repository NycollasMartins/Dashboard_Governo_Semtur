import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import Campaigns from "./pages/Campaigns";
import Contacts from "./pages/Contacts";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Operational from "./pages/Operational";
import Commercial from "./pages/Commercial";
import Team from "./pages/Team";
import Tasks from "./pages/Tasks";
import Squads from "./pages/Squads";
import Projects from "./pages/Projects";
import PendingApproval from "./pages/PendingApproval";
import Members from "./pages/Members";
import HeatmapGoverno from "./pages/HeatmapGoverno";

const C_LEVEL_POSITIONS = ["ceo", "coo"];

function CLevelRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  const position = (user as any)?.position as string | null | undefined;
  if (!position || !C_LEVEL_POSITIONS.includes(position)) {
    return <Redirect to="/" />;
  }
  return <Component />;
}

function ApprovalGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();

  // Still loading auth state
  if (loading) return null;

  // Not authenticated - let DashboardLayout handle login redirect
  if (!isAuthenticated || !user) return <>{children}</>;

  // Check approval status
  const approvalStatus = (user as any)?.approvalStatus;

  // If pending or rejected, show the pending approval page
  if (approvalStatus === "pending" || approvalStatus === "rejected") {
    return <PendingApproval />;
  }

  // Approved - show normal content
  return <>{children}</>;
}

function Router() {
  return (
    <ApprovalGate>
      <DashboardLayout>
        <Switch>
          {/* Dashboard personalizado por cargo - acessível a todos aprovados */}
          <Route path="/" component={Home} />

          {/* C-level only routes */}
          <Route path="/campaigns">{() => <CLevelRoute component={Campaigns} />}</Route>
          <Route path="/contacts">{() => <CLevelRoute component={Contacts} />}</Route>
          <Route path="/budget">{() => <CLevelRoute component={Budget} />}</Route>
          <Route path="/reports">{() => <CLevelRoute component={Reports} />}</Route>
          <Route path="/members">{() => <CLevelRoute component={Members} />}</Route>

          {/* Accessible to all approved users */}
          <Route path="/operational" component={Operational} />
          <Route path="/commercial" component={Commercial} />
          <Route path="/team" component={Team} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/squads" component={Squads} />
          <Route path="/projects" component={Projects} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
          {/* mapa de calor */}
          <Route path="/heatmap" component={HeatmapGoverno} />
        </Switch>
      </DashboardLayout>
    </ApprovalGate>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
