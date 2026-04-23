import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import ScrollToTop from "@/components/ScrollToTop";
import { OrgProvider } from "@/contexts/OrgContext";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Plans from "./pages/Plans";
import Lab from "./pages/Lab";
import AI from "./pages/AI";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import Simulator from "./pages/Simulator";
import SimulatorHistory from "./pages/SimulatorHistory";
import SimulatorSession from "./pages/SimulatorSession";
import SimulatorReport from "./pages/SimulatorReport";
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
import AdminAcademyCertificates from "./pages/admin/AdminAcademyCertificates";
import AdminObservability from "./pages/admin/AdminObservability";
import AdminObservabilityCatalogue from "./pages/admin/AdminObservabilityCatalogue";
import AdminObservabilityMatrix from "./pages/admin/AdminObservabilityMatrix";
import AdminSimulator from "./pages/admin/AdminSimulator";
import AdminSimulatorTemplates from "./pages/admin/AdminSimulatorTemplates";
import AdminPracticeStudio from "./pages/admin/AdminPracticeStudio";
import VerifyCertificate from "./pages/VerifyCertificate";
import PortalFormations from "./pages/portal/PortalFormations";
import PortalFormationsDashboard from "./pages/portal/PortalFormationsDashboard";
import PortalFormationsPath from "./pages/portal/PortalFormationsPath";
import PortalFormationsModule from "./pages/portal/PortalFormationsModule";
import PortalFormationsCertificates from "./pages/portal/PortalFormationsCertificates";
import PortalPratique from "./pages/portal/PortalPratique";
import PortalPratiqueSession from "./pages/portal/PortalPratiqueSession";
import PortalPratiqueHistory from "./pages/portal/PortalPratiqueHistory";
import PortalPratiqueReport from "./pages/portal/PortalPratiqueReport";
import PortalWorkshops from "./pages/portal/PortalWorkshops";
import PortalWorkshopRoom from "./pages/portal/PortalWorkshopRoom";
import PortalChallenges from "./pages/portal/PortalChallenges";
import PortalChallengeRoom from "./pages/portal/PortalChallengeRoom";
import PortalToolkits from "./pages/portal/PortalToolkits";
import PortalMarketplace from "./pages/portal/PortalMarketplace";
import PortalLibrary from "./pages/portal/PortalLibrary";
import PortalAnalytics from "./pages/portal/PortalAnalytics";
import PortalAcademie from "./pages/portal/PortalAcademie";
import PortalAcademieMap from "./pages/portal/PortalAcademieMap";
import PortalAcademieFunctions from "./pages/portal/PortalAcademieFunctions";
import PortalAcademieFunctionDetail from "./pages/portal/PortalAcademieFunctionDetail";
import PortalAcademiePersonae from "./pages/portal/PortalAcademiePersonae";
import PortalAcademiePaths from "./pages/portal/PortalAcademiePaths";
import PortalAcademiePathDetail from "./pages/portal/PortalAcademiePathDetail";
import PortalAcademieCampaigns from "./pages/portal/PortalAcademieCampaigns";
import PortalAcademieTracking from "./pages/portal/PortalAcademieTracking";
import PortalAcademieAssets from "./pages/portal/PortalAcademieAssets";
import PortalAcademieModuleDetail from "./pages/portal/PortalAcademieModuleDetail";
import PortalAcademieCertificates from "./pages/portal/PortalAcademieCertificates";
import PortalCertificateDetail from "./pages/portal/PortalCertificateDetail";
import PortalGuideReader from "./pages/portal/PortalGuideReader";
import PortalInsight from "./pages/portal/PortalInsight";
import AdminInsight from "./pages/admin/AdminInsight";
import PortalUCM from "./pages/portal/PortalUCM";
import PortalUCMProject from "./pages/portal/PortalUCMProject";
import PortalUCMExplorer from "./pages/portal/PortalUCMExplorer";
import AdminUCM from "./pages/admin/AdminUCM";
import AdminUCMSectors from "./pages/admin/AdminUCMSectors";
import AdminUCMPrompts from "./pages/admin/AdminUCMPrompts";
import AdminBusiness from "./pages/admin/AdminBusiness";
import AdminQuotePreview from "./pages/admin/AdminQuotePreview";
import Invitation from "./pages/Invitation";

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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/workshop" element={<Workshop />} />
          <Route path="/workshop/:id" element={<WorkshopRoom />} />
          <Route path="/challenge" element={<Challenge />} />
          <Route path="/challenge/:id" element={<ChallengeRoom />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/simulator/history" element={<SimulatorHistory />} />
          <Route path="/simulator/session" element={<SimulatorSession />} />
          <Route path="/simulator/session/:sessionId/report" element={<SimulatorReport />} />
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
          <Route path="/admin/academy/certificates" element={<AdminAcademyCertificates />} />
           <Route path="/admin/observability" element={<AdminObservability />} />
           <Route path="/admin/observability/catalogue" element={<AdminObservabilityCatalogue />} />
           <Route path="/admin/observability/matrix" element={<AdminObservabilityMatrix />} />
          <Route path="/admin/simulator" element={<AdminSimulator />} />
          <Route path="/admin/simulator/templates" element={<AdminSimulatorTemplates />} />
          <Route path="/admin/practices" element={<AdminPracticeStudio />} />
          <Route path="/admin/insight" element={<AdminInsight />} />
          <Route path="/admin/ucm" element={<AdminUCM />} />
          <Route path="/admin/ucm/sectors" element={<AdminUCMSectors />} />
          <Route path="/admin/ucm/prompts" element={<AdminUCMPrompts />} />
          <Route path="/admin/business" element={<AdminBusiness />} />
          <Route path="/admin/business/quote-preview" element={<AdminQuotePreview />} />
          {/* Portal routes */}
          <Route path="/portal" element={<PortalFormations />} />
          <Route path="/portal/dashboard" element={<PortalFormationsDashboard />} />
          <Route path="/portal/path/:id" element={<PortalFormationsPath />} />
          <Route path="/portal/module/:id" element={<PortalFormationsModule />} />
          <Route path="/portal/certificates" element={<PortalFormationsCertificates />} />
          <Route path="/portal/certificates/:id" element={<PortalCertificateDetail />} />
          <Route path="/portal/guide/:pathId" element={<PortalGuideReader />} />
          <Route path="/portal/pratique" element={<PortalPratique />} />
          <Route path="/portal/pratique/session" element={<PortalPratiqueSession />} />
          <Route path="/portal/pratique/history" element={<PortalPratiqueHistory />} />
          <Route path="/portal/pratique/session/:sessionId/report" element={<PortalPratiqueReport />} />
          <Route path="/portal/workshops" element={<PortalWorkshops />} />
          <Route path="/portal/workshops/toolkits" element={<PortalToolkits />} />
          <Route path="/portal/workshops/:id" element={<PortalWorkshopRoom />} />
          <Route path="/portal/challenges" element={<PortalChallenges />} />
          <Route path="/portal/challenges/:id" element={<PortalChallengeRoom />} />
          <Route path="/portal/marketplace" element={<PortalMarketplace />} />
          <Route path="/portal/library" element={<PortalLibrary />} />
          <Route path="/portal/analytics" element={<PortalAnalytics />} />
          <Route path="/portal/academie" element={<PortalAcademie />} />
          <Route path="/portal/academie/map" element={<PortalAcademieMap />} />
          <Route path="/portal/academie/functions" element={<PortalAcademieFunctions />} />
          <Route path="/portal/academie/functions/:id" element={<PortalAcademieFunctionDetail />} />
          <Route path="/portal/academie/personae" element={<PortalAcademiePersonae />} />
          <Route path="/portal/academie/paths" element={<PortalAcademiePaths />} />
          <Route path="/portal/academie/paths/:id" element={<PortalAcademiePathDetail />} />
          <Route path="/portal/academie/campaigns" element={<PortalAcademieCampaigns />} />
          <Route path="/portal/academie/tracking" element={<PortalAcademieTracking />} />
          <Route path="/portal/academie/assets" element={<PortalAcademieAssets />} />
          <Route path="/portal/academie/modules/:id" element={<PortalAcademieModuleDetail />} />
          <Route path="/portal/academie/certificates" element={<PortalAcademieCertificates />} />
          <Route path="/portal/insight" element={<PortalInsight />} />
          <Route path="/portal/insight/:section" element={<PortalInsight />} />
          <Route path="/portal/ucm" element={<PortalUCM />} />
          <Route path="/portal/ucm/explorer" element={<PortalUCMExplorer />} />
          <Route path="/portal/ucm/:id" element={<PortalUCMProject />} />
          <Route path="/portal/ucm/:id/scope" element={<PortalUCMProject />} />
          <Route path="/portal/ucm/:id/usecases" element={<PortalUCMProject />} />
          <Route path="/portal/ucm/:id/uc/:ucId" element={<PortalUCMProject />} />
          <Route path="/portal/ucm/:id/synthesis" element={<PortalUCMProject />} />
          <Route path="/portal/ucm/:id/chat" element={<PortalUCMProject />} />
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
        <ScrollToTop />
        <Routes>
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          <Route path="/invitation/:token" element={<Invitation />} />
          <Route path="*" element={
            <OrgProvider>
              <AnimatedRoutes />
            </OrgProvider>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
