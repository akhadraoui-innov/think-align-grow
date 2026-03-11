import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Plans from "./pages/Plans";
import Lab from "./pages/Lab";
import AI from "./pages/AI";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Workshop from "./pages/Workshop";
import WorkshopRoom from "./pages/WorkshopRoom";
import Challenge from "./pages/Challenge";
import ChallengeRoom from "./pages/ChallengeRoom";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminToolkits from "./pages/admin/AdminToolkits";
import AdminToolkitDetail from "./pages/admin/AdminToolkitDetail";
import AdminWorkshops from "./pages/admin/AdminWorkshops";
import AdminDesignInnovation from "./pages/admin/AdminDesignInnovation";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrganizationDetail from "./pages/admin/AdminOrganizationDetail";
import AdminUserDetail from "./pages/admin/AdminUserDetail";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/workshop/:id" element={<WorkshopRoom />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/challenge/:id" element={<ChallengeRoom />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="/admin/toolkits" element={<AdminToolkits />} />
          <Route path="/admin/workshops" element={<AdminWorkshops />} />
          <Route path="/admin/design-innovation" element={<AdminDesignInnovation />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
