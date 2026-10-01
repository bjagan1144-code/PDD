import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Private Pages
import DashboardPage from './pages/DashboardPage';
import SimulatorPage from './pages/SimulatorPage';
import ReleaseMonitorPage from './pages/ReleaseMonitorPage';
import AIPredictionPage from './pages/AIPredictionPage';
import DrugLibraryPage from './pages/DrugLibraryPage';
import PolymerLibraryPage from './pages/PolymerLibraryPage';
import SimulationHistoryPage from './pages/SimulationHistoryPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/simulator" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SimulatorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/release-monitor" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReleaseMonitorPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-prediction" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIPredictionPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/drugs" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DrugLibraryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/polymers" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PolymerLibraryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SimulationHistoryPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SettingsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
