/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  ImageList,
  ImageListItem
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getRecentDetections, getImageUrl, getAlertHistory } from '../../services/api.js';
import { formatDate, formatTimestamp } from '../../utils/dateFormat.js';
import { getUserSettings } from '../../utils/settings.js';
import {
  getAlertCategoryFromAlertType,
  getAlertCategoryLabel,
  getDetectionCategory,
  getAlertTypeDisplayLabel,
} from '../../utils/alertTaxonomy.js';

const AnomalyTimelineChart = () => {
  const [data, setData] = useState([]);
  const [rawDetections, setRawDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const requestSeqRef = useRef(0);
  const [days, setDays] = useState(() => {
    const settings = getUserSettings();
    const hours = settings.anomalyWindowHours || 24 * 365;
    // Convert hours to days for the toggle: clamp to supported values
    const d = Math.round(hours / 24);
    if (d === 1) return 1;
    if (d === 7) return 7;
    if (d === 30) return 30;
    if (d === 90) return 90;
    if (d === 180) return 180;
    return 365;
  }); // Default based on settings (fallback 12 months)
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateDetections, setSelectedDateDetections] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDetectionKey, setSelectedDetectionKey] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [imageMetaMap, setImageMetaMap] = useState({});

  useEffect(() => {
    fetchData(days);
  }, [days]);

  const fetchAllAlertHistoryPages = async (selectedDays) => {
    const perPage = 200;
    const pageTimeoutMs = 120000;
    const maxPages = 500;
    let page = 1;
    let total = 0;
    let allAlerts = [];

    // Load all paginated alert history rows for the selected window.
    while (page <= maxPages) {
      const response = await getAlertHistory({
        days: selectedDays,
        page,
        per_page: perPage,
        timeout: pageTimeoutMs,
      });
      const payload = response?.data || {};
      const alerts = payload.alerts || [];
      total = payload.total || 0;

      allAlerts = allAlerts.concat(alerts);

      if (alerts.length === 0 || allAlerts.length >= total) {
        break;
      }
      page += 1;
    }

    return allAlerts;
  };

  const fetchData = async (selectedDays = days) => {
    const requestId = ++requestSeqRef.current;
    try {
      setLoading(true);
      setFetchError(null);
      // Regression (post edf3d10): full alert pagination + getRecentDetections used to share the
      // default 10s axios timeout in parallel. Heavy DB load pushed /detections/recent past 10s;
      // getRecentDetections catches timeout and returns [], so CV/image bars vanished while
      // weather (alerts) still loaded. getRecentDetections now scales timeout by hours (api.js);
      // alert pages pass an explicit longer timeout above. Keep both in parallel for wall time.
      const hours = selectedDays * 24;
      const [detectionsResult, alertsResult] = await Promise.allSettled([
        getRecentDetections(hours),
        fetchAllAlertHistoryPages(selectedDays),
      ]);

      // Ignore stale requests if user changed the range again.
      if (requestId !== requestSeqRef.current) return;

      const detections =
        detectionsResult.status === 'fulfilled'
          ? (detectionsResult.value?.data?.detections || [])
          : [];
      const alerts =
        alertsResult.status === 'fulfilled'
          ? (alertsResult.value || [])
          : [];

      setRawDetections(detections);

      // Combine detections and alerts for the chart
      const chartData = transformDataForChart(detections, alerts, selectedDays);
      setData(chartData);

      const detectionsFailed = detectionsResult.status === 'rejected';
      const alertsFailed = alertsResult.status === 'rejected';
      if (detectionsFailed || alertsFailed) {
        setFetchError('Some anomaly sources failed to load. Showing partial results.');
      }
    } catch (error) {
      console.error('Error fetching detection/alert data:', error);
      // Keep previous data to avoid "empty on range switch" flicker.
      setFetchError('Failed to refresh anomaly timeline. Please try again.');
    } finally {
      if (requestId === requestSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const transformDataForChart = (detections, alerts = [], selectedDays) => {
    // Group detections and alerts by date and anomaly type
    const dateMap = {};
    const emptyBucket = () => ({
      total: 0,
      weather_environment: 0,
      tree_growth_maintenance: 0,
      plant_health_diseases: 0,
      system_sensor_status: 0,
      other: 0,
      detections: [],
    });
    const incrementBucket = (bucket, categoryKey) => {
      if (bucket[categoryKey] === undefined) {
        bucket.other += 1;
      } else {
        bucket[categoryKey] += 1;
      }
    };

    const getAlertSeverityPriority = (severity) => {
      const sev = String(severity || '').toUpperCase();
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[sev] ?? 99;
    };

    const getAlertWinterFamily = (alertType) => {
      const type = String(alertType || '').toLowerCase();
      // Client UX: collapse duplicate winter events (same timestamp) like hard_freeze vs frost_warning.
      if (
        type.includes('frost') ||
        type.includes('freeze') ||
        type.includes('hail') ||
        type.includes('snow') ||
        type.includes('ice_storm')
      ) {
        return 'winter_weather';
      }
      return null;
    };
    
    // Pre-create daily buckets so the X-axis covers the full selected range (up to today),
    // even for days where there was no data received.
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    // Inclusive range: selectedDays=1 => just today
    start.setDate(start.getDate() - (selectedDays - 1));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      const dateStr = formatDate(d);
      dateMap[dateKey] = {
        date: dateStr,
        dateKey,
        ...emptyBucket(),
      };
    }

    // Process detections (imagery anomalies)
    detections.forEach(detection => {
      // Filter out normal fruit/pear detections - these are not anomalies
      // BUT allow clusters (type: fruit, label: cluster) as they are anomalies (thinning indicator)
      const label = (detection.label || '').toLowerCase();
      const type = (detection.type || '').toLowerCase();
      const isCluster = label === 'cluster' || label === 'clustered';
      
      // Skip normal fruit/pear (but NOT clusters), blossom/bloom (growth stages)
      if (
        ((type === 'fruit' || type === 'pear') && !isCluster) ||  // Skip normal fruit, but allow clusters
        (label === 'pear' && !isCluster) ||  // Skip normal pear labels, but allow clusters
        (label === 'fruit' && !isCluster) ||  // Skip normal fruit labels, but allow clusters
        type === 'blossom' || type === 'bloom' ||
        label === 'blossom' || label === 'bloom'
      ) {
        return; // Skip normal fruit detections and growth stage indicators (blossom/bloom)
      }

      // Use the timestamp from CV analysis (not upload date)
      const dateStr = formatDate(detection.timestamp);
      const dateKey = new Date(detection.timestamp).toDateString(); // For grouping
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateStr, 
          dateKey: dateKey,
          ...emptyBucket(),
        };
      }
      dateMap[dateKey].total++;
      dateMap[dateKey].detections.push(detection);
      
      const detectionCategory = getDetectionCategory(detection);
      incrementBucket(dateMap[dateKey], detectionCategory);
    });
    
    // Process alerts (sensor/weather anomalies) - deduplicate by (alert_type, zone_id, date)
    const alertDateMap = {};
    alerts.forEach(alert => {
      const alertDate = new Date(alert.created_at);
      const dateKey = alertDate.toDateString();
      const dateStr = formatDate(alert.created_at);
      
      const winterFamily = getAlertWinterFamily(alert.alert_type);
      // Create unique key for deduplication:
      // - For winter events, collapse same-event duplicates (same zone + date bucket) like hard_freeze vs frost_warning
      // - Otherwise keep prior behavior (alert_type + zone_id + date)
      const dedupKey = winterFamily
        ? `${alert.zone_id}_${winterFamily}_${dateKey}`
        : `${alert.alert_type}_${alert.zone_id}_${dateKey}`;

      const existing = alertDateMap[dedupKey];
      if (!existing) {
        alertDateMap[dedupKey] = { date: dateStr, dateKey, alert };
        return;
      }

      // Keep the more severe alert; if equal, keep the newer one.
      const aPri = getAlertSeverityPriority(alert.severity);
      const bPri = getAlertSeverityPriority(existing.alert.severity);
      const aTime = new Date(alert.created_at).getTime();
      const bTime = new Date(existing.alert.created_at).getTime();

      if (aPri < bPri || (aPri === bPri && aTime > bTime)) {
        alertDateMap[dedupKey] = { date: dateStr, dateKey, alert };
      }
    });
    
    // Add alerts to dateMap (one per day per type per zone)
    Object.values(alertDateMap).forEach(({ dateKey, dateStr, alert }) => {
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateStr,
          dateKey: dateKey,
          ...emptyBucket(),
        };
      }
      
      dateMap[dateKey].total++;
      dateMap[dateKey].detections.push({
        ...alert,
        is_alert: true,
        label: getAlertTypeDisplayLabel(alert.alert_type) || alert.message,
        type: getAlertCategoryFromAlertType(alert.alert_type),
        timestamp: alert.created_at
      });
      
      const alertCategory = getAlertCategoryFromAlertType(alert.alert_type);
      incrementBucket(dateMap[dateKey], alertCategory);
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  };
  
  const handleBarClick = (dataEntry) => {
    if (dataEntry && dataEntry.detections && dataEntry.detections.length > 0) {
      setSelectedDate(dataEntry.date);
      setSelectedDateDetections(dataEntry.detections);
      setSelectedDetectionKey(null);
      setSelectedImageId(null);
      setImageMetaMap({});
      setDialogOpen(true);
    }
  };

  const detectionKey = (detection, index) => {
    const ts = detection?.timestamp || detection?.created_at || 'no-ts';
    const img = detection?.image_id || 'no-img';
    const label = detection?.label || detection?.alert_type || 'unknown';
    return `${ts}-${img}-${label}-${index}`;
  };

  const parseBoundingBox = (bbox, imageMeta) => {
    if (!Array.isArray(bbox) || bbox.length < 4 || !imageMeta?.naturalWidth || !imageMeta?.naturalHeight) {
      return null;
    }
    const [xMin, yMin, xMax, yMax] = bbox.map((n) => Number(n));
    if ([xMin, yMin, xMax, yMax].some((n) => Number.isNaN(n))) return null;

    const maxVal = Math.max(xMin, yMin, xMax, yMax);
    const normalized = maxVal <= 1.5; // supports [0..1] payloads too

    const leftPct = normalized ? xMin * 100 : (xMin / imageMeta.naturalWidth) * 100;
    const topPct = normalized ? yMin * 100 : (yMin / imageMeta.naturalHeight) * 100;
    const rightPct = normalized ? xMax * 100 : (xMax / imageMeta.naturalWidth) * 100;
    const bottomPct = normalized ? yMax * 100 : (yMax / imageMeta.naturalHeight) * 100;

    const widthPct = rightPct - leftPct;
    const heightPct = bottomPct - topPct;
    if (widthPct <= 0 || heightPct <= 0) return null;

    const clamp = (v) => Math.max(0, Math.min(100, v));
    return {
      left: clamp(leftPct),
      top: clamp(topPct),
      width: clamp(widthPct),
      height: clamp(heightPct),
    };
  };

  const getImageDetections = (imageId) =>
    selectedDateDetections.filter((d) =>
      !d.is_alert && d.image_id === imageId && Array.isArray(d.bbox) && d.bbox.length >= 4
    );

  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const handleDaysChange = (newValue) => {
    if (!newValue) return;
    setDays(newValue);
    // Persist anomaly window preference (shared with DiseaseMonitoringPanel)
    const hours = newValue * 24;
    const settings = getUserSettings();
    const next = { ...settings, anomalyWindowHours: hours };
    try {
      window.localStorage.setItem('pvgrow_user_settings', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Anomaly Detection Timeline
          </Typography>
          <ToggleButtonGroup
            value={days}
            exclusive
            onChange={(e, newValue) => handleDaysChange(newValue)}
            size="small"
          >
            <ToggleButton value={1}>24h</ToggleButton>
            <ToggleButton value={7}>7d</ToggleButton>
            <ToggleButton value={30}>30d</ToggleButton>
            <ToggleButton value={90}>3M</ToggleButton>
            <ToggleButton value={180}>6M</ToggleButton>
            <ToggleButton value={365}>12M</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
        {fetchError && (
          <Box sx={{ mb: 1, px: 1, py: 0.75, borderRadius: 1, bgcolor: 'warning.light' }}>
            <Typography variant="caption" color="warning.dark">
              {fetchError}
            </Typography>
          </Box>
        )}
        {data.reduce((acc, d) => acc + (d.total || 0), 0) === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No anomalies detected in the selected period
            </Typography>
          </Box>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 50, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  style={{ fontSize: '0.85rem' }}
                  angle={days >= 90 ? 0 : -45}
                  textAnchor={days >= 90 ? 'middle' : 'end'}
                  height={days >= 90 ? 60 : 120}
                  interval={days <= 7 ? 0 : days <= 14 ? 1 : days <= 30 ? 2 : days <= 90 ? 6 : days <= 180 ? 13 : 29}
                  tick={{ fontSize: days >= 90 ? '0.75rem' : '0.85rem' }}
                />
                <YAxis stroke="#666" style={{ fontSize: '0.85rem' }} width={60} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                  cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                <Bar 
                  dataKey="weather_environment"
                  stackId="a" 
                  fill="#42a5f5"
                  name={getAlertCategoryLabel('weather_environment')}
                  onClick={(data) => {
                    if (data && data.detections) {
                      handleBarClick(data);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-disease-${index}`} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="tree_growth_maintenance"
                  stackId="a" 
                  fill="#ffb300"
                  name={getAlertCategoryLabel('tree_growth_maintenance')}
                  onClick={(data) => {
                    if (data && data.detections) {
                      handleBarClick(data);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-maintenance-${index}`} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
                <Bar 
                  dataKey="plant_health_diseases"
                  stackId="a"
                  fill="#ef5350"
                  name={getAlertCategoryLabel('plant_health_diseases')}
                  onClick={(data) => {
                    if (data && data.detections) {
                      handleBarClick(data);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-health-${index}`} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
                <Bar
                  dataKey="system_sensor_status"
                  stackId="a"
                  fill="#8d6e63"
                  name={getAlertCategoryLabel('system_sensor_status')}
                  onClick={(data) => {
                    if (data && data.detections) {
                      handleBarClick(data);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-system-${index}`} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
                <Bar
                  dataKey="other" 
                  stackId="a" 
                  fill="#9e9e9e" 
                  name={getAlertCategoryLabel('other')}
                  onClick={(data) => {
                    if (data && data.detections) {
                      handleBarClick(data);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-other-${index}`} style={{ cursor: 'pointer' }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Click on a bar to view detailed anomalies for that date
            </Typography>
          </>
        )}
          </>
        )}

        {/* Anomaly Details Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { maxHeight: '90vh' }
          }}
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Anomalies Detected on {selectedDate}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {selectedDateDetections.length} detection{selectedDateDetections.length !== 1 ? 's' : ''}
            </Typography>
          </DialogTitle>
          <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <List>
              {selectedDateDetections.map((detection, index) => {
                const key = detectionKey(detection, index);
                const isSelected = selectedDetectionKey === key;
                return (
                <ListItem
                  key={key}
                  onClick={() => {
                    setSelectedDetectionKey(key);
                    if (detection.image_id) setSelectedImageId(detection.image_id);
                  }}
                  sx={{
                    borderBottom: '1px solid #eee',
                    py: 2,
                    px: 1,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(33, 150, 243, 0.10)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #2196f3' : '3px solid transparent',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      {detection.is_alert 
                        ? (detection.label || detection.message || 'Unknown Alert')
                        : (detection.label?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown')}
                    </Typography>
                    {detection.is_alert ? (
                      <>
                        <Chip 
                          label={detection.severity || 'MEDIUM'}
                          size="small"
                          color={detection.severity === 'HIGH' || detection.severity === 'CRITICAL' ? 'error' : detection.severity === 'MEDIUM' ? 'warning' : 'info'}
                        />
                        <Chip 
                          label={detection.zone_id === 'ALL_ZONES' ? 'All Zones' : detection.zone_id?.replace('PV_Zone_', 'Zone ') || 'Unknown Zone'}
                          size="small"
                          variant="outlined"
                        />
                      </>
                    ) : (
                      <>
                        <Chip 
                          label={`${Math.round((detection.confidence_score || 0) * 100)}% confidence`}
                          size="small"
                          color={(detection.confidence_score || 0) >= 0.8 ? 'error' : (detection.confidence_score || 0) >= 0.6 ? 'warning' : 'info'}
                        />
                        <Chip 
                          label={detection.zone_id === 'ALL_ZONES' ? 'All Zones' : detection.zone_id?.replace('PV_Zone_', 'Zone ') || 'Unknown Zone'}
                          size="small"
                          variant="outlined"
                        />
                        {detection.image_id && (
                          <Chip
                            label={`Image ${String(detection.image_id).slice(0, 8)}...`}
                            size="small"
                            color="primary"
                            variant={isSelected ? 'filled' : 'outlined'}
                          />
                        )}
                      </>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {detection.is_alert ? 'Alert Created' : 'Detected'}: {formatTimestamp(detection.timestamp)}
                    {detection.type && ` • Type: ${detection.type}`}
                    {detection.is_alert && detection.message && ` • ${detection.message}`}
                  </Typography>
                </ListItem>
              )})}
            </List>
            
            {/* Show images if available - deduplicate by image_id */}
            {(() => {
              const uniqueImageIds = [...new Set(selectedDateDetections
                .filter(d => d.image_id)
                .map(d => d.image_id)
              )];
              
              return uniqueImageIds.length > 0 ? (
                <Box sx={{ mt: 4, pt: 3, borderTop: '2px solid #eee' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Associated Images ({uniqueImageIds.length})
                  </Typography>
                  <ImageList cols={3} gap={12} sx={{ mb: 2 }}>
                    {uniqueImageIds.map((imageId, index) => {
                      const imageDetections = getImageDetections(imageId);
                      const hasSelectedInImage = selectedDateDetections.some(
                        (d, i) =>
                          d.image_id === imageId && selectedDetectionKey === detectionKey(d, i)
                      );
                      const imageMeta = imageMetaMap[imageId];
                      return (
                      <ImageListItem key={index}>
                        <Box
                          sx={{
                            position: 'relative',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: hasSelectedInImage || selectedImageId === imageId ? '2px solid #2196f3' : '2px solid #ddd',
                            '&:hover': {
                              border: '2px solid #2196f3',
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <img
                            src={getImageUrl(imageId)}
                            alt={`Anomaly image ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            style={{ 
                              width: '100%', 
                              height: 'auto',
                              display: 'block',
                              cursor: 'pointer'
                            }}
                            onLoad={(e) => {
                              const { naturalWidth, naturalHeight } = e.currentTarget;
                              setImageMetaMap((prev) => ({
                                ...prev,
                                [imageId]: { naturalWidth, naturalHeight },
                              }));
                            }}
                            onClick={() => window.open(getImageUrl(imageId), '_blank')}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {/* Bounding box overlay layer */}
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              pointerEvents: 'none',
                            }}
                          >
                            {imageDetections.map((detection, detIndex) => {
                              const globalIdx = selectedDateDetections.findIndex(
                                (d) =>
                                  d === detection ||
                                  (d.timestamp === detection.timestamp &&
                                    d.image_id === detection.image_id &&
                                    d.label === detection.label &&
                                    d.confidence_score === detection.confidence_score)
                              );
                              const key = detectionKey(detection, globalIdx >= 0 ? globalIdx : detIndex);
                              const isSelected = selectedDetectionKey === key;
                              const rect = parseBoundingBox(detection.bbox, imageMeta);
                              if (!rect) return null;
                              return (
                                <Box
                                  key={key}
                                  sx={{
                                    position: 'absolute',
                                    left: `${rect.left}%`,
                                    top: `${rect.top}%`,
                                    width: `${rect.width}%`,
                                    height: `${rect.height}%`,
                                    border: isSelected ? '2px solid #00e5ff' : '2px solid #ff1744',
                                    boxShadow: isSelected ? '0 0 0 2px rgba(0, 229, 255, 0.35)' : 'none',
                                    backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.10)' : 'rgba(255, 23, 68, 0.08)',
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -18,
                                      left: 0,
                                      bgcolor: isSelected ? '#00b8d4' : '#d50000',
                                      color: 'white',
                                      px: 0.5,
                                      py: 0.1,
                                      borderRadius: 0.5,
                                      fontSize: '0.62rem',
                                      lineHeight: 1.2,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {(detection.label || 'anomaly').replace(/_/g, ' ')} {Math.round((detection.confidence_score || 0) * 100)}%
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              p: 0.5,
                              textAlign: 'center',
                              fontSize: '0.7rem'
                            }}
                          >
                            {imageDetections.length} detection{imageDetections.length !== 1 ? 's' : ''} • click text to highlight box
                          </Box>
                        </Box>
                      </ImageListItem>
                    )})}
                  </ImageList>
                </Box>
              ) : null;
            })()}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AnomalyTimelineChart;


