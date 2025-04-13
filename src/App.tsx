
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { OrganizationProvider, useOrganization } from './contexts/OrganizationContext';
import { supabase } from './integrations/supabaseClient';
import OrganizationSetup from './components/OrganizationSetup';
import AuthForm from './components/AuthForm';
import { Toaster } from 'sonner';

// Import your routes
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import UserRegistration from './pages/UserRegistration';
import DeviceRegistration from './pages/DeviceRegistration';
import Devices from './pages/Devices';
// Import other routes as needed

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { userHasOrganization, isLoading: orgLoading } = useOrganization();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading || orgLoading) {
    // Show loading spinner or skeleton
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!userHasOrganization) {
    // Show organization setup if user is authenticated but has no organization
    return <OrganizationSetup />;
  }

  // User is authenticated and has an organization, render the protected content
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<AuthForm />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="user-registration" element={<UserRegistration />} />
          <Route path="user-registration/:id" element={<UserRegistration />} />
          <Route path="device-registration/:clientId" element={<DeviceRegistration />} />
          <Route path="device-registration/:clientId/:deviceId" element={<DeviceRegistration />} />
          <Route path="devices" element={<Devices />} />
          {/* Add other protected routes as needed */}
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <OrganizationProvider>
        <AppRoutes />
        <Toaster />
      </OrganizationProvider>
    </ThemeProvider>
  );
}

export default App;
