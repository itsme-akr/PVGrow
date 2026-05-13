/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';

// Import our reusable components with the correct .jsx extension
import SensorDataTable from '../components/SensorDataTable.jsx';
import ZoneSensorSummary from '../components/ZoneSensorSummary.jsx';
import AnomalyImageViewer from '../components/AnomalyImageViewer.jsx';
import DashboardZoneSelector from '../components/DashboardZoneSelector.jsx';
import Footer from '../components/Footer.jsx';
import { getActiveAlerts, getRecentDetections } from '../services/api.js';
import { formatTimestamp } from '../utils/dateFormat.js';
import { getUserSettings, updateUserSettings } from '../utils/settings.js';
import {
  alertCategories,
  getAlertCategoryColor,
  getAlertCategoryFromAlertType,
  getAlertCategoryLabel,
  getAlertTypeDisplayLabel,
} from '../utils/alertTaxonomy.js';

const AlertsPage = () => {
  const [selectedZone, setSelectedZone] = useState(() => {
    const settings = getUserSettings();
    return settings.defaultZone || 'PV_Zone_1';
  });
  const [alerts, setAlerts] = useState([]);
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch alerts and detections
        const [alertsResponse, detectionsResponse] = await Promise.all([
          getActiveAlerts(),
          getRecentDetections(168) // Last 7 days
        ]);
        
        setAlerts(alertsResponse.data || []);
        setDetections(detectionsResponse.data?.detections || []);
      } catch (error) {
        console.error('Error fetching alerts data:', error);
        setAlerts([]);
        setDetections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
    updateUserSettings({ defaultZone: zoneId });
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <ReportProblemIcon color="error" sx={{ fontSize: 40 }} />;
      case 'MEDIUM':
        return <WarningAmberIcon color="warning" sx={{ fontSize: 40 }} />;
      default:
        return <InfoIcon color="info" sx={{ fontSize: 40 }} />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return { bgcolor: 'error.lighter', border: '1px solid #f44336' };
      case 'MEDIUM':
        return { bgcolor: 'warning.lighter', border: '1px solid #ff9800' };
      default:
        return { bgcolor: 'info.lighter', border: '1px solid #2196f3' };
    }
  };

  // Deduplicate alerts by (alert_type, zone_id) and show only most recent per group
  const deduplicateAlerts = (alertList) => {
    const grouped = {};
    alertList.forEach((alert) => {
      const key = alert.zone_id === 'ALL_ZONES' 
        ? alert.alert_type 
        : `${alert.alert_type}_${alert.zone_id}`;
      if (!grouped[key]) {
        grouped[key] = alert;
      } else {
        // Keep the most recent one
        const existingDate = new Date(grouped[key].created_at);
        const newDate = new Date(alert.created_at);
        if (newDate > existingDate) {
          grouped[key] = alert;
        }
      }
    });
    return Object.values(grouped).sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      const aPriority = priorityOrder[a.severity?.toUpperCase()] ?? 99;
      const bPriority = priorityOrder[b.severity?.toUpperCase()] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const settings = getUserSettings();
  const severityFilter = settings.alertSeverityFilter || {};
  const groupingMode = settings.alertGroupingMode || 'time';

  const isSeverityVisible = (severity) => {
    if (!severity) return true;
    const key = severity.toUpperCase();
    return severityFilter[key] !== false;
  };

  const deduplicatedAlerts = deduplicateAlerts(alerts).filter((a) => isSeverityVisible(a.severity));
  const alertZones = Array.from(
    new Set(
      deduplicatedAlerts
        .map((a) => a.zone_id)
        .filter(Boolean)
    )
  );
  const alertTypes = Array.from(
    new Set(
      deduplicatedAlerts
        .map((a) => a.alert_type)
        .filter(Boolean)
    )
  );
  const availableCategories = Array.from(
    new Set(deduplicatedAlerts.map((a) => getAlertCategoryFromAlertType(a.alert_type)))
  );
  const filteredAlerts = deduplicatedAlerts.filter((alert) => {
    const categoryMatch =
      categoryFilter === 'ALL' || getAlertCategoryFromAlertType(alert.alert_type) === categoryFilter;
    const zoneMatch = zoneFilter === 'ALL' || alert.zone_id === zoneFilter;
    const typeMatch = typeFilter === 'ALL' || alert.alert_type === typeFilter;
    return categoryMatch && zoneMatch && typeMatch;
  });

  const groupAlerts = (alertList) => {
    if (groupingMode === 'zone') {
      const groups = {};
      alertList.forEach((alert) => {
        const key = alert.zone_id || 'UNKNOWN';
        if (!groups[key]) groups[key] = [];
        groups[key].push(alert);
      });
      return Object.entries(groups).map(([key, items]) => ({
        key,
        label: key === 'ALL_ZONES' ? 'All Zones' : key.replace('PV_Zone_', 'Zone '),
        items,
      }));
    }
    if (groupingMode === 'type') {
      const groups = {};
      alertList.forEach((alert) => {
        const key = alert.alert_type || 'other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(alert);
      });
      return Object.entries(groups).map(([key, items]) => ({
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        items,
      }));
    }
    if (groupingMode === 'category') {
      const groups = {};
      alertList.forEach((alert) => {
        const key = getAlertCategoryFromAlertType(alert.alert_type);
        if (!groups[key]) groups[key] = [];
        groups[key].push(alert);
      });
      return Object.entries(groups).map(([key, items]) => ({
        key,
        label: getAlertCategoryLabel(key),
        items,
      }));
    }
    // Default: time (single group)
    return [
      {
        key: 'time',
        label: null,
        items: alertList,
      },
    ];
  };

  const groupedAlerts = groupAlerts(filteredAlerts);
  const setSeverityVisibility = (severity, visible) => {
    const current = getUserSettings().alertSeverityFilter || {};
    updateUserSettings({
      alertSeverityFilter: {
        ...current,
        [severity]: visible,
      },
    });
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Alerts and Recommendation System
      </Typography>

      {/* Zone Selector */}
      <Box sx={{ mb: 3, maxWidth: 600 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>
          Select Zone for Image View:
        </Typography>
        <DashboardZoneSelector onZoneSelect={handleZoneChange} currentZone={selectedZone} />
      </Box>

      {/* --- THIS IS THE MAIN LAYOUT GRID --- */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* --- LEFT COLUMN --- */}
        <Box sx={{ flex: '1 1 58%', minWidth: 0 }}>
          {/* Selected Zone Sensor Summary (replaces all-zones table) */}
          <Box sx={{ mb: 3 }}>
            <ZoneSensorSummary zoneId={selectedZone} />
          </Box>
          
          {/* Active Alerts - Real Data */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Active Alerts ({filteredAlerts.length} unique)
            </Typography>
            <Card sx={{ mb: 1.5 }}>
              <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.6, color: 'text.secondary' }}>
                      Severity
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(86px, 1fr))',
                        gap: 0.7,
                        minWidth: 190,
                      }}
                    >
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                        <Chip
                          key={sev}
                          label={sev}
                          size="small"
                          color={isSeverityVisible(sev) ? 'primary' : 'default'}
                          variant={isSeverityVisible(sev) ? 'filled' : 'outlined'}
                          onClick={() => setSeverityVisibility(sev, !isSeverityVisible(sev))}
                          sx={{
                            width: '100%',
                            minWidth: 86,
                            height: 28,
                            borderRadius: 1.5,
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            justifyContent: 'center',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <FormControl size="small" sx={{ minWidth: 140, flex: '1 1 140px', maxWidth: 180 }}>
                    <InputLabel id="alerts-grouping-label">Group By</InputLabel>
                    <Select
                      labelId="alerts-grouping-label"
                      value={groupingMode}
                      label="Group By"
                      onChange={(e) => updateUserSettings({ alertGroupingMode: e.target.value })}
                    >
                      <MenuItem value="time">Time</MenuItem>
                      <MenuItem value="zone">Zone</MenuItem>
                      <MenuItem value="type">Type</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 220, flex: '1 1 220px' }}>
                    <InputLabel id="alerts-category-filter-label">Category</InputLabel>
                    <Select
                      labelId="alerts-category-filter-label"
                      value={categoryFilter}
                      label="Category"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Categories</MenuItem>
                      {availableCategories.map((c) => (
                        <MenuItem key={c} value={c}>
                          {getAlertCategoryLabel(c)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 170, flex: '1 1 170px' }}>
                    <InputLabel id="alerts-zone-filter-label">Zone</InputLabel>
                    <Select
                      labelId="alerts-zone-filter-label"
                      value={zoneFilter}
                      label="Zone"
                      onChange={(e) => setZoneFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Zones</MenuItem>
                      {alertZones.map((z) => (
                        <MenuItem key={z} value={z}>
                          {z === 'ALL_ZONES' ? 'All Zones' : z.replace('PV_Zone_', 'Zone ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 190, flex: '1 1 190px' }}>
                    <InputLabel id="alerts-type-filter-label">Type</InputLabel>
                    <Select
                      labelId="alerts-type-filter-label"
                      value={typeFilter}
                      label="Type"
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Types</MenuItem>
                      {alertTypes.map((t) => (
                        <MenuItem key={t} value={t}>
                          {getAlertTypeDisplayLabel(t)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No alerts match the selected filters
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
                    {groupedAlerts.map((group) => (
                      <Box key={group.key} sx={{ mb: group.label ? 1.5 : 0 }}>
                        {group.label && (
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 'bold', px: 1.5, pt: 1.5, pb: 0.5, color: 'text.secondary' }}
                          >
                            {group.label}
                          </Typography>
                        )}
                        {group.items.map((alert, index) => (
                          <Box
                            key={`${group.key}-${index}`}
                            sx={{
                              ...getAlertColor(alert.severity),
                              mb: 1,
                              mx: 1,
                              p: 1.5,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {getAlertIcon(alert.severity)}
                            <Box sx={{ ml: 2, flex: 1 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                                {getAlertTypeDisplayLabel(alert.alert_type) || 'Alert'}
                                {alert.zone_id !== 'ALL_ZONES' && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ ml: 1, color: 'text.secondary' }}
                                  >
                                    ({alert.zone_id.replace('PV_Zone_', 'Zone ')})
                                  </Typography>
                                )}
                                {alert.zone_id === 'ALL_ZONES' && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ ml: 1, color: 'text.secondary' }}
                                  >
                                    (All Zones)
                                  </Typography>
                                )}
                              </Typography>
                              <Box sx={{ mt: 0.4 }}>
                                <Chip
                                  size="small"
                                  label={getAlertCategoryLabel(getAlertCategoryFromAlertType(alert.alert_type))}
                                  sx={{
                                    height: 20,
                                    fontSize: '0.68rem',
                                    bgcolor: `${getAlertCategoryColor(getAlertCategoryFromAlertType(alert.alert_type))}20`,
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {alert.created_at ? formatTimestamp(alert.created_at) : '-'}
                              </Typography>
                              {alert.message && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {alert.message}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
          
          {/* Anomaly History - Real Data */}
          <Box>
            <Card sx={{ bgcolor: 'info.lighter', border: '1px solid #2196f3' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Anomaly History</Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : detections.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No anomalies detected in the last 7 days
                  </Typography>
                ) : (
                  <List dense>
                    {detections.slice(0, 10).map((detection, index) => (
                      <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatTimestamp(detection.timestamp)}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="error">
                              {detection.label?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                              {' '}({Math.round(detection.confidence_score * 100)}% confidence)
                              {' '}- {detection.zone_id}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* --- RIGHT COLUMN --- */}
        <Box sx={{ flex: '1 1 42%', minWidth: 0 }}>
          {/* Image at the top right */}
          <Box sx={{ mb: 2 }}>
            <AnomalyImageViewer selectedZone={selectedZone} />
          </Box>
          
          {/* Recommendations - Real Data */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommendations ({filteredAlerts.filter(a => a.recommendation).length} unique)
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : filteredAlerts.filter(a => a.recommendation).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recommendations at this time
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 500, overflowY: 'auto', pr: 1 }}>
                    <List dense>
                      {filteredAlerts
                        .filter(alert => alert.recommendation)
                        .map((alert, index) => (
                          <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <InfoIcon color="primary" sx={{ fontSize: 20 }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={alert.recommendation}
                              secondary={
                                alert.zone_id === 'ALL_ZONES' ? 'All Zones' : alert.zone_id.replace('PV_Zone_', 'Zone ')
                              }
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

      </Box>
      <Footer />
    </Box>
  );
};

export default AlertsPage;