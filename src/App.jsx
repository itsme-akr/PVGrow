/** @jsxImportSource @emotion/react */
import React, { Suspense } from 'react';

import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';

import theme from './theme';

import Sidebar from './components/Sidebar';

import './styles/App.css';

import GDPRConsentModal from './components/GDPRConsentModal';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';

const Dashboard = React.lazy(() => import('./pages/DashboardPage'));
const AlertsPage = React.lazy(() => import('./pages/AlertsPage'));
const WeatherPage = React.lazy(() => import('./pages/WeatherPage.jsx'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage.jsx'));
const TasksPage = React.lazy(() => import('./pages/TasksPage.jsx'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage.jsx'));
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage.jsx'));
const LoginPage = React.lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = React.lazy(() => import('./pages/SignupPage.jsx'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage.jsx'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage.jsx'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toLowerCase()
  );

  const currentRole = (user.role || '').toLowerCase();

  if (!normalizedAllowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const UnauthorizedPage = () => (
  <Box
    sx={{
      display: 'flex',
      minHeight: '60vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Typography
      variant="h4"
      sx={{
        fontWeight: 700,
      }}
    >
      Access denied
    </Typography>

    <Typography color="text.secondary">
      Your account does not have permission
      to access this page.
    </Typography>

    <Button
      variant="contained"
      component={RouterLink}
      to="/dashboard"
    >
      Back to Dashboard
    </Button>
  </Box>
);

function AppInner() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <Box
  component="main"
  sx={{
    flexGrow: 1,

    minHeight: '100vh',

    background:
      'linear-gradient(180deg,#f1f5f9 0%,#eef2f7 100%)',

    px: {
      xs: 2,
      sm: 3,
      md: 4,
    },

    py: {
      xs: 2,
      sm: 3,
    },

    overflowX: 'hidden',
  }}
>
        {/* CONTENT CONTAINER */}
        <Box
          sx={{
            width: '100%',
          }}
        >
          <Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '60vh',
                }}
              >
                <CircularProgress />
              </Box>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/weather"
                element={
                  <ProtectedRoute>
                    <WeatherPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
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
                path="/settings"
                element={
                  <RoleRoute
                    allowedRoles={[
                      'admin',
                      'farmer',
                    ]}
                  >
                    <SettingsPage />
                  </RoleRoute>
                }
              />

              <Route
                path="/admin/users"
                element={
                  <RoleRoute
                    allowedRoles={['admin']}
                  >
                    <AdminUsersPage />
                  </RoleRoute>
                }
              />

              <Route
                path="/unauthorized"
                element={
                  <ProtectedRoute>
                    <UnauthorizedPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route
                path="/signup"
                element={<SignupPage />}
              />

              <Route
                path="/verify-email"
                element={<VerifyEmailPage />}
              />

              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Router>
        <AuthProvider>
          <AppInner />

          <GDPRConsentModal />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;