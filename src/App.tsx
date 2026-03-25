import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { OrgProvider } from "@/contexts/OrgContext";
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
import AdminChallengeDetail from "./pages/admin/AdminChallengeDetail";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOrganizationDetail from "./pages/admin/AdminOrganizationDetail";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import Academy from "./pages/Academy";
import AcademyPath from "./pages/AcademyPath";
import AcademyModule from "./pages/AcademyModule";
import AcademyDashboard from "./pages/AcademyDashboard";
import AcademyCertificates from "./pages/AcademyCertificates";
import AdminAcademy from "./pages/admin/AdminAcademy";
import AdminAcademyPersonae from "./pages/admin/AdminAcademyPersonae";
import AdminAcademyPaths from "./pages/admin/AdminAcademyPaths";
import AdminAcademyCampaigns from "./pages/admin/AdminAcademyCampaigns";
import AdminAcademyPathDetail from "./pages/admin/AdminAcademyPathDetail";
import AdminAcademyFunctions from "./pages/admin/AdminAcademyFunctions";
import AdminAcademyFunctionDetail from "./pages/admin/AdminAcademyFunctionDetail";
import AdminAcademyMap from "./pages/admin/AdminAcademyMap";
import AdminAcademyTracking from "./pages/admin/AdminAcademyTracking";
import AdminAcademyModuleDetail from "./pages/admin/AdminAcademyModuleDetail";
import AdminAcademyAssets from "./pages/admin/AdminAcademyAssets";
import AdminObservability from "./pages/admin/AdminObservability";

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
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/dashboard" element={<AcademyDashboard />} />
          <Route path="/academy/path/:id" element={<AcademyPath />} />
          <Route path="/academy/certificates" element={<AcademyCertificates />} />
          <Route path="/academy/module/:id" element={<AcademyModule />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
          <Route path="/admin/toolkits" element={<AdminToolkits />} />
          <Route path="/admin/toolkits/:id" element={<AdminToolkitDetail />} />
          <Route path="/admin/workshops" element={<AdminWorkshops />} />
          <Route path="/admin/design-innovation" element={<AdminDesignInnovation />} />
          <Route path="/admin/design-innovation/:id" element={<AdminChallengeDetail />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/academy" element={<AdminAcademy />} />
          <Route path="/admin/academy/personae" element={<AdminAcademyPersonae />} />
          <Route path="/admin/academy/paths" element={<AdminAcademyPaths />} />
          <Route path="/admin/academy/paths/:id" element={<AdminAcademyPathDetail />} />
          <Route path="/admin/academy/campaigns" element={<AdminAcademyCampaigns />} />
          <Route path="/admin/academy/functions" element={<AdminAcademyFunctions />} />
          <Route path="/admin/academy/functions/:id" element={<AdminAcademyFunctionDetail />} />
          <Route path="/admin/academy/map" element={<AdminAcademyMap />} />
          <Route path="/admin/academy/tracking" element={<AdminAcademyTracking />} />
          <Route path="/admin/academy/modules/:id" element={<AdminAcademyModuleDetail />} />
          <Route path="/admin/academy/assets" element={<AdminAcademyAssets />} />
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
        <OrgProvider>
          <AnimatedRoutes />
        </OrgProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
