/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import { getAlertHistory } from '../../services/api.js';
import { formatTimestamp } from '../../utils/dateFormat.js';

const severityColors = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const AlertsHistorySection = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [total, setTotal] = useState(0);

  const getAlertSeverityPriority = (severity) => {
    const sev = String(severity || '').toUpperCase();
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[sev] ?? 99;
  };

  const getAlertWeatherFamily = (alertType) => {
    const type = String(alertType || '').toLowerCase();
    // Client UX requirement: collapse same-event frost duplicates (e.g., hard_freeze vs frost_warning).
    if (
      type.includes('frost') ||
      type.includes('freeze') ||
      type.includes('hail') // sometimes paired with winter events
    ) {
      return 'winter_weather';
    }
    return null;
  };

  const toMinuteKey = (createdAt) => {
    if (!createdAt) return 'no-time';
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return 'no-time';
    // ISO minute key in UTC: stable for dedup, independent from browser timezone.
    return d.toISOString().slice(0, 16);
  };

  // Deduplicate only within the visible page for the "winter_weather" family.
  // Keep the highest-severity alert when multiple alerts share the same zone + timestamp minute.
  const getDeduplicatedAlerts = (alertList) => {
    const frostMap = {};
    const others = [];

    alertList.forEach((alert) => {
      const family = getAlertWeatherFamily(alert.alert_type);
      if (!family) {
        others.push(alert);
        return;
      }

      const zone = alert.zone_id || 'UNKNOWN';
      const key = `${zone}|${family}|${toMinuteKey(alert.created_at)}`;
      const existing = frostMap[key];

      if (!existing) {
        frostMap[key] = alert;
        return;
      }

      // Higher severity wins; if equal, later created_at wins.
      const aPri = getAlertSeverityPriority(alert.severity);
      const bPri = getAlertSeverityPriority(existing.severity);
      const aDate = new Date(alert.created_at);
      const bDate = new Date(existing.created_at);

      const aValid = !Number.isNaN(aDate.getTime());
      const bValid = !Number.isNaN(bDate.getTime());
      const aTime = aValid ? aDate.getTime() : 0;
      const bTime = bValid ? bDate.getTime() : 0;

      if (aPri < bPri || (aPri === bPri && aTime > bTime)) {
        frostMap[key] = alert;
      }
    });

    const dedupedWinter = Object.values(frostMap);
    const combined = [...others, ...dedupedWinter];
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return combined;
  };

  const fetchAlerts = async (pageNumber = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAlertHistory({ days: 365, page: pageNumber, per_page: perPage });
      const data = response.data || {};
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
      setPage(data.page || pageNumber);
    } catch (err) {
      setError('Failed to load alert history');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
  }, []);

  const deduplicatedAlertsForDisplay = getDeduplicatedAlerts(alerts);

  if (loading) {
    return (
      <Card id="alerts-history">
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Alerts History (Past 12 Months)
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="alerts-history">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Alerts History (Past 12 Months)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Showing {alerts.length} of {total} alerts
          </Typography>
        </Stack>

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : alerts.length === 0 ? (
          <Alert severity="info">No alerts recorded yet.</Alert>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deduplicatedAlertsForDisplay.map(alert => (
                    <TableRow key={alert.id} hover>
                      <TableCell>{formatTimestamp(alert.created_at)}</TableCell>
                      <TableCell>{alert.zone_id?.replace('PV_', '').replace('_', ' ') || '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{alert.alert_type?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        <Chip
                          label={alert.severity?.toUpperCase() || 'N/A'}
                          color={severityColors[alert.severity] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.is_active ? 'Active' : 'Resolved'}
                          color={alert.is_active ? 'error' : 'success'}
                          size="small"
                          variant={alert.is_active ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" color="text.secondary" noWrap title={alert.description}>
                          {alert.description || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(total / perPage)}
                page={page}
                onChange={(_, value) => fetchAlerts(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsHistorySection;

