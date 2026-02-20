import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { WorkdayPage } from '@/pages/WorkdayPage';
import { WeeklyPlannerPage } from '@/pages/WeeklyPlannerPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { RecurringTasksPage } from '@/pages/RecurringTasksPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfilePage } from '@/pages/ProfilePage';

import { useAppStore } from '@/store/appStore';
import { useDataLoader } from '@/hooks/useDataLoader';

/**
 * Root application shell.
 * Handles routing, sidebar toggle, and authenticated layout rendering.
 */
const AppShell: React.FC = () => {
  useDataLoader();

  const isLoading = useAppStore((s) => s.isLoading);
  const user = useAppStore((s) => s.user);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-deepnavy flex text-white font-sans selection:bg-pilot-orange/30 overflow-hidden">
      {user && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      <main
        className={`flex-1 transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden relative ${
          user ? 'lg:ml-72 p-6 lg:p-12' : ''
        }`}
      >
        {user && (
          <TopBar toggleSidebar={() => setIsSidebarOpen(true)} />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pr-2">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <WorkdayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planner"
              element={
                <ProtectedRoute>
                  <WeeklyPlannerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recurring"
              element={
                <ProtectedRoute>
                  <RecurringTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
};

/**
 * Top-level component: wraps the app with the router and a global error boundary.
 */
const App: React.FC = () => (
  <ErrorBoundary>
    <HashRouter>
      <AppShell />
    </HashRouter>
  </ErrorBoundary>
);

export default App;
