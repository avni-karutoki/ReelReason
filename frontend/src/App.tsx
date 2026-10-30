import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';
import { StudioLayout } from './components/layout/StudioLayout';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/common/AuthModal';
import { PageFade } from './components/common/Reveal';

import { LandingPage } from './pages/LandingPage';
import { UploadPage } from './pages/UploadPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ClipDashboardPage } from './pages/ClipDashboardPage';
import { ClipEditorPage } from './pages/ClipEditorPage';
import { ExportPage } from './pages/ExportPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

// Scroll to top with smooth reset on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Marketing Layout for Landing Page
const MarketingLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-main font-sans selection:bg-indigo-500/20 selection:text-indigo-600 dark:selection:text-indigo-300 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <PageFade>
          {children}
        </PageFade>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* 1. Landing Page (Public Marketing Shell) */}
            <Route
              path="/"
              element={
                <MarketingLayout>
                  <LandingPage />
                </MarketingLayout>
              }
            />

            {/* 2. Authentication Pages (Login & Sign Up) */}
            <Route
              path="/login"
              element={<AuthPage />}
            />
            <Route
              path="/signup"
              element={<AuthPage />}
            />

            {/* 3. Upload Page (Studio Shell) */}
            <Route
              path="/upload"
              element={
                <StudioLayout>
                  <UploadPage />
                </StudioLayout>
              }
            />

            {/* 4. Processing Page (Studio Shell) */}
            <Route
              path="/project/:id/processing"
              element={
                <StudioLayout>
                  <ProcessingPage />
                </StudioLayout>
              }
            />

            {/* 5. Clip Dashboard (Studio Shell) */}
            <Route
              path="/project/:id/clips"
              element={
                <StudioLayout>
                  <ClipDashboardPage />
                </StudioLayout>
              }
            />

            {/* 6. Clip Editor (Studio Shell) */}
            <Route
              path="/project/:id/clips/:clipId"
              element={
                <StudioLayout>
                  <ClipEditorPage />
                </StudioLayout>
              }
            />

            {/* 7. Export Page (Studio Shell) */}
            <Route
              path="/project/:id/export"
              element={
                <StudioLayout>
                  <ExportPage />
                </StudioLayout>
              }
            />

            {/* 8. Project History (Studio Shell) */}
            <Route
              path="/projects"
              element={
                <StudioLayout>
                  <ProjectsPage />
                </StudioLayout>
              }
            />

            {/* 9. Settings Page (Studio Shell) */}
            <Route
              path="/settings"
              element={
                <StudioLayout>
                  <SettingsPage />
                </StudioLayout>
              }
            />

            {/* Fallback route */}
            <Route
              path="*"
              element={
                <MarketingLayout>
                  <LandingPage />
                </MarketingLayout>
              }
            />
          </Routes>
          
          {/* Global Auth Modal for instant access from any screen */}
          <AuthModal />

          <Toaster position="bottom-right" richColors closeButton theme="system" />
        </BrowserRouter>
      </AuthProvider>
    </ProjectProvider>
  );
}
