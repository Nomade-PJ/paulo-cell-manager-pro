import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Devices from "./pages/Devices";
import Services from "./pages/Services";
import Inventory from "./pages/Inventory";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import UserRegistration from "./pages/UserRegistration";
import DeviceRegistration from "./pages/DeviceRegistration";
import ServiceRegistration from "./pages/ServiceRegistration";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="user-registration" element={<UserRegistration />} />
                <Route path="user-registration/:id" element={<UserRegistration />} />
                <Route path="device-registration/new" element={<DeviceRegistration />} />
                <Route path="device-registration/:clientId" element={<DeviceRegistration />} />
                <Route path="device-registration/:clientId/:deviceId" element={<DeviceRegistration />} />
                <Route path="service-registration/new" element={<ServiceRegistration />} />
                <Route path="service-registration/:clientId/:deviceId" element={<ServiceRegistration />} />
                <Route path="clients" element={<Clients />} />
                <Route path="devices" element={<Devices />} />
                <Route path="services" element={<Services />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="documents" element={<Documents />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Redirecionar rotas antigas para as novas */}
              <Route path="/clients" element={<Navigate to="/dashboard/clients" replace />} />
              <Route path="/devices" element={<Navigate to="/dashboard/devices" replace />} />
              <Route path="/services" element={<Navigate to="/dashboard/services" replace />} />
              <Route path="/inventory" element={<Navigate to="/dashboard/inventory" replace />} />
              <Route path="/documents" element={<Navigate to="/dashboard/documents" replace />} />
              <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
