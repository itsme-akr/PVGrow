/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, List, ListItem, ListItemIcon,
  ListItemText, Button, Box, Chip, Snackbar, Alert as MuiAlert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AirIcon from '@mui/icons-material/Air';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import { getActiveAlerts, getAllFeedback, submitAlertFeedback } from '../services/api.js';
import { getUserSettings } from '../utils/settings.js';

const getAlertProps = (severity, alertType) => {
  const weatherIcons = {
    'frost_warning': <AcUnitIcon />,
    'hard_freeze': <AcUnitIcon />,
    'snow_warning': <AcUnitIcon />,
    'ice_storm': <AcUnitIcon />,
    'high_wind': <AirIcon />,
    'heavy_rain': <ThunderstormIcon />,
  };

  const icon = weatherIcons[alertType] ||
    (severity === 'HIGH' ? <ReportProblemIcon /> :
     severity === 'MEDIUM' ? <WarningAmberIcon /> :
     <CheckCircleOutlineIcon />);

  if (severity === 'CRITICAL') return { color: '#d32f2f', icon };
  if (severity === 'HIGH') return { color: 'error.main', icon };
  if (severity === 'MEDIUM') return { color: 'warning.main', icon };
  return { color: 'success.main', icon };
};

const AlertsPanel = ({ cardProps = {}, typographyProps = {} }) => {
  const [alerts, setAlerts] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');
      const [alertsRes, fbRes] = await Promise.all([
        getActiveAlerts(),
        getAllFeedback(),
      ]);
      if (alertsRes.data && Array.isArray(alertsRes.data) && alertsRes.data.length > 0) {
        setAlerts(alertsRes.data);
        setConnectionStatus('connected');
      } else {
        setAlerts([]);
        setConnectionStatus('connected');
      }
      setFeedbackMap(fbRes.data?.feedback || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err);
      setConnectionStatus('disconnected');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFeedback = async (alertId, feedback) => {
    const prev = { ...feedbackMap };
    setFeedbackMap((m) => ({ ...m, [alertId]: feedback }));
    try {
      await submitAlertFeedback(alertId, feedback);
      setSnack({ open: true, message: `Feedback recorded: ${feedback}`, severity: 'success' });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setFeedbackMap(prev);
      setSnack({ open: true, message: 'Failed to submit feedback.', severity: 'error' });
    }
  };

  const deduplicateAlerts = (alertList) => {
    const grouped = {};
    alertList.forEach((alert) => {
      const key = alert.zone_id === 'ALL_ZONES'
        ? alert.alert_type
        : `${alert.alert_type}_${alert.zone_id}`;
      if (!grouped[key] || new Date(alert.created_at) > new Date(grouped[key].created_at)) {
        grouped[key] = alert;
      }
    });
    return Object.values(grouped);
  };

  const settings = getUserSettings();
  const severityFilter = settings.alertSeverityFilter || {};
  const isSeverityVisible = (severity) => {
    if (!severity) return true;
    return severityFilter[severity.toUpperCase()] !== false;
  };

  const displayAlerts = (() => {
    if (loading) {
      return [{ severity: 'LOW', message: 'Checking for alerts...', alert_type: 'loading' }];
    }
    if (alerts.length === 0) {
      return [{ severity: 'LOW', message: 'No active alerts - all systems normal', alert_type: 'normal' }];
    }
    return deduplicateAlerts(alerts)
      .filter((a) => isSeverityVisible(a.severity))
      .sort((a, b) => {
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const diff = (order[a.severity?.toUpperCase()] ?? 99) - (order[b.severity?.toUpperCase()] ?? 99);
        return diff !== 0 ? diff : new Date(b.created_at) - new Date(a.created_at);
      });
  })();

  return (
    <Card
  sx={{
    p: 2.5,
    borderRadius: '24px',
    minHeight: 'unset',

    height: 'fit-content',

    background:
      'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',

    border:
      '1px solid rgba(15,23,42,0.06)',

    transition: 'all 0.25s ease',

    '&:hover': {
      transform: 'translateY(-4px)',

      boxShadow:
        '0 18px 40px rgba(15,23,42,0.10)',
    },

    ...cardProps.sx,
  }}
>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Alerts
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {connectionStatus === 'disconnected' && (
              <Chip icon={<ErrorOutlineIcon />} label="No Connection" color="error" size="small" sx={{ fontSize: '0.7rem' }} />
            )}
            {connectionStatus === 'connected' && !loading && (
              <Chip label="Connected" color="success" size="small" sx={{ fontSize: '0.7rem' }} />
            )}
            <Button
              size="small"
              variant="text"
              onClick={() => {
                navigate('/analytics#alerts-history');
                setTimeout(() => {
                  const el = document.getElementById('alerts-history');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
            >
              See all
            </Button>
          </Box>
        </Box>

        {connectionStatus === 'disconnected' ? (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="error">
              Sensors are not working or with no connection
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unable to fetch alert data
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 1 }}>
            <List dense>
              {displayAlerts.slice(0, 10).map((alert, index) => {
                const { color, icon } = getAlertProps(alert.severity, alert.alert_type);
                const alertMessage = alert.message || alert.text || alert.description || 'No message available';
                const severityLabel = alert.severity === 'CRITICAL' ? 'Critical' :
                                     alert.severity === 'HIGH' ? 'High' :
                                     alert.severity === 'MEDIUM' ? 'Medium' : 'Low';
                const fb = alert.id ? feedbackMap[alert.id] : null;
                const isPlaceholder = alert.alert_type === 'loading' || alert.alert_type === 'normal';

                return (
                  <ListItem key={alert.id || index} disablePadding sx={{ mb: 1.2 }}>
                    <ListItemIcon sx={{ minWidth: 28, color }}>{icon}</ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.9rem' } }}
                      primary={`${severityLabel}: ${alertMessage}`}
                    />
                    {!isPlaceholder && (
                      <Box sx={{ display: 'flex', gap: 0.3, flexShrink: 0, ml: 0.5 }}>
                        <Button
                          size="small"
                          variant={fb === 'good' ? 'contained' : 'outlined'}
                          color="success"
                          onClick={() => handleFeedback(alert.id, 'good')}
                          disabled={fb === 'good'}
                          sx={{ minWidth: 0, py: 0.1, px: 0.6, fontSize: '0.6rem' }}
                        >
                          <ThumbUpAltIcon sx={{ fontSize: 13, mr: 0.3 }} />
                          Good
                        </Button>
                        <Button
                          size="small"
                          variant={fb === 'irrelevant' ? 'contained' : 'outlined'}
                          color="warning"
                          onClick={() => handleFeedback(alert.id, 'irrelevant')}
                          disabled={fb === 'irrelevant'}
                          sx={{ minWidth: 0, py: 0.1, px: 0.6, fontSize: '0.6rem' }}
                        >
                          <ThumbDownAltIcon sx={{ fontSize: 13, mr: 0.3 }} />
                          Irrelevant
                        </Button>
                      </Box>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </CardContent>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Card>
  );
};

export default AlertsPanel;
