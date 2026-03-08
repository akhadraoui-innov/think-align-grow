import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Plans from "./pages/Plans";
import Lab from "./pages/Lab";
import AI from "./pages/AI";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/lab" element={<Lab />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
