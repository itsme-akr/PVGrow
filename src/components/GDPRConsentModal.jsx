/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  Divider,
} from '@mui/material';
import { PrivacyTip as PrivacyIcon } from '@mui/icons-material';

const GDPR_STATEMENT = {
  title: "AgriPV Platform – GDPR Data Protection Statement",
  sections: [
    {
      heading: "1. Purpose of This Document",
      content: "This document describes how the AgriPV platform collects, processes, stores, and protects personal data in compliance with the EU General Data Protection Regulation (GDPR, Regulation (EU) 2016/679). It is intended for ethics review, project documentation, and transparency towards users and stakeholders."
    },
    {
      heading: "2. Scope of Data Processing",
      content: "The AgriPV platform supports agricultural decision-making using sensor data, camera images, and user-provided inputs. While the system is not designed to identify individuals, incidental capture of personal data may occur. GDPR applies to all personal data processed within the platform."
    },
    {
      heading: "3. Types of Personal Data",
      content: "The platform may process the following categories of personal data:",
      subsections: [
        {
          heading: "3.1 Camera Images",
          content: "Fixed cameras capture images of agricultural areas (e.g. orchards) at an hourly interval. Cameras are intended to monitor crops and infrastructure. Incidental images of people working in the area may be captured. These images are considered personal data under GDPR Article 4(1), even if no identification or analysis of individuals is performed."
        },
        {
          heading: "3.2 User-Provided Data",
          content: "Users may voluntarily provide data to the platform for recommendation and decision-support purposes, such as farm-related parameters, operational preferences, and system configuration inputs. User accounts or identifiers are stored only when strictly necessary for system functionality."
        },
        {
          heading: "3.3 System and Technical Data",
          content: "Access logs, system usage metadata, and error and security logs are processed solely for system operation, security, and maintenance."
        }
      ]
    },
    {
      heading: "4. Purpose and Legal Basis for Processing",
      content: "Personal data are processed only for the following purposes: monitoring crop and system conditions in an AgriPV environment, providing agronomic and operational recommendations, ensuring platform security, reliability, and integrity, and scientific research and system performance evaluation (where applicable).",
      legalBasis: "Legal bases under GDPR Article 6: Explicit informed consent (Article 6(1)(a)) for research participation and user-provided data, and legitimate interest (Article 6(1)(f)) for system security and infrastructure monitoring."
    },
    {
      heading: "5. Consent Mechanism",
      content: "Clear information is provided to users and on-site personnel about data collection. Where required, explicit, informed, and documented consent is obtained before data are used for research or personalized recommendations. Consent can be withdrawn at any time without negative consequences."
    },
    {
      heading: "6. Data Minimization and Privacy by Design",
      content: "The platform follows GDPR principles of privacy by design and by default: cameras are positioned to minimize capture of identifiable individuals, no biometric identification or facial recognition is performed, images are not manually reviewed unless required for system diagnostics, and only data strictly necessary for platform functionality are collected."
    },
    {
      heading: "7. Data Storage and Security Measures",
      content: "All system data are protected using appropriate technical and organizational measures, including secure servers with controlled access, encryption of data at rest and in transit where applicable, role-based access control, and regular system updates and security monitoring. Access to personal data is restricted to authorized personnel only."
    },
    {
      heading: "8. Data Retention",
      content: "Personal data are stored for defined and limited periods in accordance with GDPR principles: Camera images are retained for a short operational period and in any case no longer than 5 years, after which they are automatically deleted or irreversibly anonymized. User-provided data are retained for the duration of the user's participation and no longer than 5 years after the end of project activities, unless earlier deletion is requested. System and security logs are retained for operational and legal purposes for up to 10 years. All retention periods are documented, periodically reviewed, and justified by project objectives, legal obligations, and accountability requirements."
    },
    {
      heading: "9. Data Sharing and Transfers",
      content: "Personal data are not sold or shared with third parties. Data may be processed by trusted service providers under GDPR-compliant data processing agreements. No data are transferred outside the EU unless adequate safeguards are in place."
    },
    {
      heading: "10. Data Subject Rights",
      content: "In accordance with GDPR, individuals have the right to: access their personal data, request correction or deletion, restrict or object to processing, and withdraw consent at any time. Requests can be submitted via the platform's designated contact channel."
    },
    {
      heading: "11. Accountability and Compliance",
      content: "The project team is responsible for ensuring ongoing GDPR compliance through documentation of data processing activities, regular review of data protection measures, and ethics and data protection oversight."
    },
    {
      heading: "12. Contact Information",
      content: "A designated data protection contact or responsible project representative is available to address questions or concerns related to personal data processing."
    }
  ],
  closing: "This document demonstrates the AgriPV platform's commitment to responsible data handling, user privacy, and GDPR compliance."
};

const GDPRConsentModal = () => {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('gdpr_consent');
    const consentTimestamp = localStorage.getItem('gdpr_consent_timestamp');
    
    if (!consent || consent !== 'accepted') {
      // Show modal if no consent or consent was withdrawn
      setOpen(true);
    } else {
      setConsented(true);
      setOpen(false);
    }
  }, []);

  const handleAgree = () => {
    if (hasRead) {
      localStorage.setItem('gdpr_consent', 'accepted');
      localStorage.setItem('gdpr_consent_timestamp', new Date().toISOString());
      setConsented(true);
      setOpen(false);
    }
  };

  const handleDisagree = () => {
    localStorage.setItem('gdpr_consent', 'rejected');
    localStorage.setItem('gdpr_consent_timestamp', new Date().toISOString());
    setConsented(false);
    setOpen(false);
    // Optionally redirect or show a message that platform cannot be used without consent
    alert('You have declined to provide consent. Some features of the platform may be limited.');
  };

  const handleWithdrawConsent = () => {
    localStorage.removeItem('gdpr_consent');
    localStorage.removeItem('gdpr_consent_timestamp');
    setConsented(false);
    setOpen(true);
  };

  // Expose method to reopen modal (for footer link)
  useEffect(() => {
    window.showGDPRConsent = () => {
      setOpen(true);
      setHasRead(false);
    };
    window.withdrawGDPRConsent = handleWithdrawConsent;
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PrivacyIcon color="primary" />
          <Typography variant="h6" component="span" fontWeight="bold">
            {GDPR_STATEMENT.title}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ flex: 1, overflow: 'auto', px: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please read the following data protection statement carefully before providing your consent.
          </Typography>
        </Box>

        {GDPR_STATEMENT.sections.map((section, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
              {section.heading}
            </Typography>
            <Typography variant="body2" paragraph sx={{ lineHeight: 1.8 }}>
              {section.content}
            </Typography>
            {section.legalBasis && (
              <Typography variant="body2" paragraph sx={{ lineHeight: 1.8, fontStyle: 'italic' }}>
                {section.legalBasis}
              </Typography>
            )}
            {section.subsections && section.subsections.map((subsection, subIndex) => (
              <Box key={subIndex} sx={{ ml: 2, mt: 1, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {subsection.heading}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                  {subsection.content}
                </Typography>
              </Box>
            ))}
            {index < GDPR_STATEMENT.sections.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}

        <Paper elevation={0} sx={{ p: 2, mt: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.8 }}>
            {GDPR_STATEMENT.closing}
          </Typography>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I have read and understood the GDPR Data Protection Statement
            </Typography>
          }
        />
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleDisagree}
          variant="outlined"
          color="error"
          sx={{ mr: 1 }}
        >
          Disagree
        </Button>
        <Button
          onClick={handleAgree}
          variant="contained"
          color="primary"
          disabled={!hasRead}
        >
          Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GDPRConsentModal;

