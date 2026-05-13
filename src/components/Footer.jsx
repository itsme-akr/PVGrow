/** @jsxImportSource @emotion/react */
import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  const handleGDPRClick = (e) => {
    e.preventDefault();
    if (window.showGDPRConsent) {
      window.showGDPRConsent();
    }
  };

  const handleWithdrawConsent = (e) => {
    e.preventDefault();
    if (window.withdrawGDPRConsent) {
      if (window.confirm('Are you sure you want to withdraw your GDPR consent? You will need to provide consent again to continue using the platform.')) {
        window.withdrawGDPRConsent();
      }
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '240px', // Start after sidebar (sidebar width is 240px)
        right: 0,
        py: 1,
        px: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        zIndex: 1000
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.55rem',
            color: 'text.disabled',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          By using this platform, you agree to participate in ongoing user testing of system recommendations and anomaly alerts. Your selections and feedback will help improve system accuracy. Participation is voluntary, and all interactions are anonymized and used solely for research and development purposes.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="#"
            onClick={handleGDPRClick}
            variant="caption"
            sx={{
              fontSize: '0.55rem',
              color: 'primary.main',
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': {
                color: 'primary.dark',
              },
            }}
          >
            GDPR Data Protection Statement
          </Link>
          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>
            •
          </Typography>
          <Link
            href="#"
            onClick={handleWithdrawConsent}
            variant="caption"
            sx={{
              fontSize: '0.55rem',
              color: 'error.main',
              textDecoration: 'underline',
              cursor: 'pointer',
              '&:hover': {
                color: 'error.dark',
              },
            }}
          >
            Withdraw Consent
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

