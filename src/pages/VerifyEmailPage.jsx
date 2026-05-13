/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress, Alert, Link } from '@mui/material';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { verifyEmailRequest } from '../services/api.js';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing verification token.');
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await verifyEmailRequest(token);
        setMessage(res?.message || 'Email verified successfully. You can now log in.');
      } catch (err) {
        console.error('Email verification failed:', err);
        const apiMessage = err?.response?.data?.detail;
        setError(apiMessage || 'Verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams]);

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
      <Card sx={{ maxWidth: 480, width: '100%', boxShadow: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Email Verification
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary">
                Verifying your email. Please wait…
              </Typography>
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {!loading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can now return to the login page.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                sx={{ px: 4 }}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {!loading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                If this link does not work, you can request a new verification email from the login page.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmailPage;

