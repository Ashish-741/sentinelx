/**
 * @fileoverview SentinelX Router configuration.
 */

import { createBrowserRouter } from 'react-router-dom';
import App from './App';

import { Suspense, lazy } from 'react';

// Lazy load Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const URLScannerPage = lazy(() => import('./pages/URLScannerPage'));
const EmailAnalyzerPage = lazy(() => import('./pages/EmailAnalyzerPage'));
const ThreatIntelPage = lazy(() => import('./pages/ThreatIntelPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ScanHistoryPage = lazy(() => import('./pages/ScanHistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorFallback from './components/common/ErrorFallback';
import NotFoundPage from './components/common/NotFoundPage';


export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0e27' }}></div>}>
        <App />
      </Suspense>
    ),
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        errorElement: <ErrorFallback />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'scanner',
            element: <URLScannerPage />,
          },
          {
            path: 'email',
            element: <EmailAnalyzerPage />,
          },
          {
            path: 'threat-intel',
            element: <ThreatIntelPage />,
          },
          {
            path: 'history',
            element: <ScanHistoryPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          {
            path: 'admin',
            element: (
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);