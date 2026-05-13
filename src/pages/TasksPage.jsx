/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Card, CardContent, Box, Chip, Button, Divider,
  CircularProgress, Snackbar, Alert as MuiAlert, Tabs, Tab, Tooltip,
} from '@mui/material';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import BugReportIcon from '@mui/icons-material/BugReport';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WarningIcon from '@mui/icons-material/Warning';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getActiveAlerts, getTaskStatuses, updateTaskStatus } from '../services/api.js';
import Footer from '../components/Footer.jsx';
import { formatTimestamp } from '../utils/dateFormat.js';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#9e9e9e', bg: '#f5f5f5',  icon: <RadioButtonUncheckedIcon fontSize="small" /> },
  in_progress: { label: 'In Progress', color: '#ed6c02', bg: '#fff3e0',  icon: <HourglassEmptyIcon fontSize="small" /> },
  completed:   { label: 'Completed',   color: '#2e7d32', bg: '#e8f5e9',  icon: <CheckCircleIcon fontSize="small" /> },
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const getTaskIcon = (alertType) => {
    switch (alertType?.toLowerCase()) {
      case 'fire_blight': case 'blight': return <ArrowCircleRightIcon />;
      case 'irrigation': case 'soil_moisture': return <WaterDropIcon />;
      case 'temperature': case 'heat_stress': return <ThermostatIcon />;
      case 'irradiance': case 'sunburn': return <WbSunnyIcon />;
      case 'disease': case 'rust': return <BugReportIcon />;
      default: return <WarningIcon />;
    }
  };

  const getPriorityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': case 'critical': return 'error.main';
      case 'medium': case 'moderate': return 'warning.main';
      case 'low': return 'info.main';
      default: return 'warning.main';
    }
  };

  const formatAlertsAsTasks = (alerts) => {
    const grouped = {};
    const duplicates = {};

    alerts.forEach((alert) => {
      const key = `${alert.alert_type}_${alert.zone_id}`;
      if (!grouped[key]) {
        grouped[key] = alert;
        duplicates[key] = 1;
      } else {
        duplicates[key] += 1;
        if (new Date(alert.created_at) > new Date(grouped[key].created_at)) {
          grouped[key] = alert;
        }
      }
    });

    return Object.values(grouped).map((alert, index) => {
      const key = `${alert.alert_type}_${alert.zone_id}`;
      return {
        id: alert.id || index + 1,
        title: alert.alert_type
          ? alert.alert_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : 'Agricultural Alert',
        details: alert.recommendation || alert.message || 'Monitor conditions and take appropriate action.',
        priority: alert.severity || 'Medium',
        source: alert.triggered_by === 'sensor' ? 'Sensor Alert' : 'System Alert',
        zone: alert.zone_id === 'ALL_ZONES' ? 'All Zones' : (alert.zone_id || 'Multiple Zones'),
        icon: getTaskIcon(alert.alert_type),
        timestamp: alert.created_at,
        duplicateCount: duplicates[key] > 1 ? duplicates[key] : null,
      };
    }).sort((a, b) => {
      const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const diff = (order[a.priority?.toUpperCase()] ?? 99) - (order[b.priority?.toUpperCase()] ?? 99);
      return diff !== 0 ? diff : new Date(b.timestamp) - new Date(a.timestamp);
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertsRes, statusesRes] = await Promise.all([
        getActiveAlerts(),
        getTaskStatuses(),
      ]);
      if (alertsRes.data && Array.isArray(alertsRes.data)) {
        setTasks(formatAlertsAsTasks(alertsRes.data));
      } else {
        setTasks([]);
      }
      setStatusMap(statusesRes.data?.statuses || {});
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Unable to load tasks. Please check system connectivity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusChange = async (alertId, newStatus) => {
    const prevMap = { ...statusMap };
    setStatusMap((prev) => ({ ...prev, [alertId]: newStatus }));
    try {
      await updateTaskStatus(alertId, newStatus);
      setSnack({ open: true, message: `Task marked as ${STATUS_CONFIG[newStatus].label}`, severity: 'success' });
    } catch (err) {
      console.error('Failed to update task status:', err);
      setStatusMap(prevMap);
      setSnack({ open: true, message: 'Failed to update status. Please try again.', severity: 'error' });
    }
  };

  const getTaskStatus = (taskId) => statusMap[taskId] || 'pending';

  const filteredTasks = tasks.filter((task) => {
    const status = getTaskStatus(task.id);
    if (tabValue === 0) return true;
    if (tabValue === 1) return status === 'pending';
    if (tabValue === 2) return status === 'in_progress';
    if (tabValue === 3) return status === 'completed';
    return true;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => getTaskStatus(t.id) === 'pending').length,
    in_progress: tasks.filter(t => getTaskStatus(t.id) === 'in_progress').length,
    completed: tasks.filter(t => getTaskStatus(t.id) === 'completed').length,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Task Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Track and manage active recommendations. Mark tasks as in-progress or completed.
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={`All (${counts.all})`} />
        <Tab label={`Pending (${counts.pending})`} />
        <Tab label={`In Progress (${counts.in_progress})`} />
        <Tab label={`Completed (${counts.completed})`} />
      </Tabs>

      {error && (
        <Card sx={{ mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent><Typography>{error}</Typography></CardContent>
        </Card>
      )}

      {filteredTasks.length === 0 && !loading && !error ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              {tabValue === 0 ? 'No active tasks — all systems running smoothly!' : 'No tasks in this category.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        filteredTasks.map((task) => {
          const status = getTaskStatus(task.id);
          const cfg = STATUS_CONFIG[status];
          return (
            <Card
              key={task.id}
              sx={{
                mb: 2,
                borderLeft: `4px solid ${cfg.color}`,
                bgcolor: status === 'completed' ? '#fafafa' : 'background.paper',
                opacity: status === 'completed' ? 0.85 : 1,
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box sx={{ color: getPriorityColor(task.priority), mr: 1.5 }}>
                      {task.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, textDecoration: status === 'completed' ? 'line-through' : 'none' }}>
                          {task.title}
                        </Typography>
                        {task.duplicateCount && (
                          <Chip label={`${task.duplicateCount} similar`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        )}
                        <Chip
                          icon={cfg.icon}
                          label={cfg.label}
                          size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={task.source} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        <Chip label={task.zone} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }} />
                        {task.priority && (
                          <Chip
                            label={task.priority}
                            size="small"
                            color={task.priority === 'High' || task.priority === 'CRITICAL' ? 'error' : task.priority === 'Medium' ? 'warning' : 'info'}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                    <Tooltip title="Mark as In Progress">
                      <span>
                        <Button
                          size="small"
                          variant={status === 'in_progress' ? 'contained' : 'outlined'}
                          color="warning"
                          onClick={() => handleStatusChange(task.id, 'in_progress')}
                          disabled={status === 'in_progress'}
                          sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.7rem' }}
                        >
                          <HourglassEmptyIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          In Progress
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Mark as Completed">
                      <span>
                        <Button
                          size="small"
                          variant={status === 'completed' ? 'contained' : 'outlined'}
                          color="success"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          disabled={status === 'completed'}
                          sx={{ minWidth: 0, px: 1.2, py: 0.4, fontSize: '0.7rem' }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          Completed
                        </Button>
                      </span>
                    </Tooltip>
                    {status !== 'pending' && (
                      <Tooltip title="Reset to Pending">
                        <Button
                          size="small"
                          variant="text"
                          color="inherit"
                          onClick={() => handleStatusChange(task.id, 'pending')}
                          sx={{ minWidth: 0, px: 0.8, py: 0.4, fontSize: '0.65rem', color: 'text.secondary' }}
                        >
                          Reset
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  {task.details}
                </Typography>

                {task.timestamp && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Created: {formatTimestamp(task.timestamp)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert severity={snack.severity} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.message}
        </MuiAlert>
      </Snackbar>

      <Footer />
    </Box>
  );
};

export default TasksPage;
