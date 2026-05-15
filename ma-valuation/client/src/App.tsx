import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import HistoricalData from "./pages/HistoricalData";
import Strategy from "./pages/Strategy";
import BusinessPlan from "./pages/BusinessPlan";
import Valuation from "./pages/Valuation";
import Simulation from "./pages/Simulation";
import Exports from "./pages/Exports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/historical" component={HistoricalData} />
      <Route path="/strategy" component={Strategy} />
      <Route path="/business-plan" component={BusinessPlan} />
      <Route path="/valuation" component={Valuation} />
      <Route path="/simulation" component={Simulation} />
      <Route path="/exports" component={Exports} />
      <Route path="/project/:id" component={Dashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(18% 0.06 240)",
                border: "1px solid oklch(28% 0.07 240)",
                color: "white",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
