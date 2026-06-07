import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

// ── Lazy-loaded page bundles (code-split per route) ───────────────────────────
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage         = lazy(() => import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const WorkdayPage        = lazy(() => import('@/pages/WorkdayPage').then((m) => ({ default: m.WorkdayPage })));
const TasksPage          = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const WeeklyPlannerPage  = lazy(() => import('@/pages/WeeklyPlannerPage').then((m) => ({ default: m.WeeklyPlannerPage })));
const ProjectsPage       = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const CalendarPage       = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const RecurringTasksPage = lazy(() => import('@/pages/RecurringTasksPage').then((m) => ({ default: m.RecurringTasksPage })));
const ReportsPage        = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const ProfilePage        = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const MailPage           = lazy(() => import('@/pages/MailPage').then((m) => ({ default: m.MailPage })));
const FilesPage          = lazy(() => import('@/pages/FilesPage').then((m) => ({ default: m.FilesPage })));

import { useAppStore } from '@/store/appStore';
import { useDataLoader } from '@/hooks/useDataLoader';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Root application shell.
 * Handles routing, sidebar toggle, and authenticated layout rendering.
 */
const AppShell: React.FC = () => {
  useDataLoader();

  const isLoading = useAppStore((s) => s.isLoading);
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const tasks = useAppStore((s) => s.tasks);
  const calendarEvents = useAppStore((s) => s.calendarEvents);
  const recurringTasks = useAppStore((s) => s.recurringTasks);
  usePushNotifications(tasks, calendarEvents, recurringTasks);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className={`min-h-screen bg-deepnavy flex font-sans selection:bg-pilot-orange/30 overflow-hidden ${theme === 'light' ? 'light text-slate-900' : 'text-white'}`}>
      {user && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      <main
        className={`flex-1 transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden relative ${
          user ? 'lg:ml-72 p-6 lg:p-12' : ''
        }`}
      >
        {user && (
          <TopBar
            toggleSidebar={() => setIsSidebarOpen((o: boolean) => !o)}
            onAddTask={() => setIsQuickAddOpen(true)}
          />
        )}
        {user && (
          <AddTaskModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pr-2">
          <Suspense fallback={<LoadingSpinner />}>
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
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
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

            <Route
              path="/mail"
              element={
                <ProtectedRoute>
                  <MailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <FilesPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
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
