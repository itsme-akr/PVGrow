/** @jsxImportSource @emotion/react */
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { loginRequest, resendVerificationRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    setShowResendVerification(false);
    setLoading(true);
    try {
      const tokenData = await loginRequest(email, password);
      await login(tokenData);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      const apiDetail = err?.response?.data?.detail;

      if (err?.response?.status === 403 && apiDetail?.includes('not verified')) {
        setError('Your email is not verified. Please check your inbox or resend the verification email.');
        setShowResendVerification(true);
      } else {
        setError(apiDetail || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage(null);
    setResendLoading(true);
    try {
      const result = await resendVerificationRequest(email);
      setResendMessage(result.message || 'Verification email has been resent. Please check your inbox.');
    } catch (err) {
      console.error('Resend verification failed:', err);
      setResendMessage('Unable to resend verification email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
            PVGROW Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Please sign in to access the AgriPV monitoring dashboard.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {resendMessage && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {resendMessage}
            </Alert>
          )}

          {showResendVerification && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResendVerification}
                disabled={resendLoading || !email}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 1 }}
              fullWidth
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              <Link component={RouterLink} to="/forgot-password" underline="hover">
                Forgot password?
              </Link>
            </Typography>
          </Box>
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Link component={RouterLink} to="/signup" underline="hover">
                Sign up
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;


