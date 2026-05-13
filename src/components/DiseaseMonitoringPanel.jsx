/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { getRecentDetections, getAllImageAnalysesForZone } from '../services/api.js';
import { getUserSettings } from '../utils/settings.js';
import { formatDate, formatDateRange } from '../utils/dateFormat.js';

const DiseaseMonitoringPanel = ({ cardProps = {} }) => {
  const RECENT_WINDOW_DAYS = 60;
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ today: 0, week: 0 });
  const [dateRange, setDateRange] = useState(null);
  const [growthMetrics, setGrowthMetrics] = useState({});

  const fetchDetections = async () => {
    try {
      setLoading(true);
      // Fetch detections using per-device anomaly window preference
      const settings = getUserSettings();
      const hours = settings.anomalyWindowHours || 24 * 365;
      const response = await getRecentDetections(hours);
      
      if (response.data && response.data.detections) {
        // Group detections by type and zone
        const grouped = {};
        let todayCount = 0;
        let weekCount = 0;
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let minDate = null;
        let maxDate = null;

        response.data.detections.forEach(detection => {
          // Filter out normal fruit/pear detections and fallen fruits (handled separately)
          // BUT allow clusters (type: fruit, label: cluster) as they are anomalies (thinning indicator)
          const label = (detection.label || '').toLowerCase();
          const type = (detection.type || '').toLowerCase();
          const isCluster = label === 'cluster' || label === 'clustered';
          
          // Skip normal fruit/pear (but NOT clusters), fallen fruits
          if (
            ((type === 'fruit' || type === 'pear') && !isCluster) ||  // Skip normal fruit, but allow clusters
            (label === 'pear' && !isCluster) ||  // Skip normal pear labels, but allow clusters
            (label === 'fruit' && !isCluster) ||  // Skip normal fruit labels, but allow clusters
            label.includes('fallen')
          ) {
            return; // Skip these - not anomalies, or handled in separate section
          }

          const key = `${detection.type}_${detection.zone_id}`;
          const detectionTime = new Date(detection.timestamp);

          if (!minDate || detectionTime < minDate) {
            minDate = detectionTime;
          }
          if (!maxDate || detectionTime > maxDate) {
            maxDate = detectionTime;
          }
          
          if (detectionTime >= oneDayAgo) {
            todayCount++;
          }
          
          if (detectionTime >= sevenDaysAgo) {
            weekCount++;
          }
          
          if (!grouped[key]) {
            grouped[key] = {
              type: detection.type,
              label: detection.label,
              zone_id: detection.zone_id,
              count: 0,
              max_confidence: 0,
              latest_timestamp: detection.timestamp
            };
          }
          
          grouped[key].count++;
          grouped[key].max_confidence = Math.max(
            grouped[key].max_confidence, 
            detection.confidence_score
          );
          
          // Keep the latest timestamp
          if (new Date(detection.timestamp) > new Date(grouped[key].latest_timestamp)) {
            grouped[key].latest_timestamp = detection.timestamp;
          }
        });
        
        // Convert to array and sort by confidence
        const detectionsArray = Object.values(grouped).sort(
          (a, b) => b.max_confidence - a.max_confidence
        );
        
        setDetections(detectionsArray);
        setSummary({ today: todayCount, week: weekCount });
        setDateRange(
          minDate && maxDate
            ? {
                start: minDate,
                end: maxDate,
                isStale: (new Date() - maxDate) / (1000 * 60 * 60 * 24) > 7,
              }
            : null
        );
      } else {
        setDetections([]);
        setSummary({ today: 0, week: 0 });
        setDateRange(null);
      }
    } catch (error) {
      console.error('Error fetching detections:', error);
      setDetections([]);
      setSummary({ today: 0, week: 0 });
      setDateRange(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthMetrics = async () => {
    try {
      // Fetch all analyses for all zones to aggregate historical data
      const zones = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];
      const allAnalysesPromises = zones.map(zoneId => 
        getAllImageAnalysesForZone(zoneId, RECENT_WINDOW_DAYS).catch(() => ({ data: { analyses: [], date_range: null } }))
      );
      
      const allAnalysesResults = await Promise.all(allAnalysesPromises);
      
      // Aggregate all analyses by zone
      const aggregated = {};
      let globalMinDate = null;
      let globalMaxDate = null;
      
      allAnalysesResults.forEach((result, index) => {
        const zoneId = zones[index];
        if (result.data && result.data.analyses && result.data.analyses.length > 0) {
          // Get the most recent analysis for this zone
          const latest = [...result.data.analyses].reverse().find(a => a.growth_metrics);
          
          if (latest && latest.growth_metrics) {
            // Aggregate metrics from all analyses for this zone
            const allMetrics = result.data.analyses
              .map(a => a.growth_metrics)
              .filter(m => m !== null && m !== undefined);
            
            aggregated[zoneId] = {
              growth_metrics: {
                // Use latest values for most fields, but sum counts
                ...latest.growth_metrics,
                fallen_pear_count: allMetrics.reduce((sum, m) => sum + (m.fallen_pear_count || 0), 0),
                trimming_count: allMetrics.reduce((sum, m) => sum + (m.trimming_count || 0), 0),
              },
              date_range: result.data.date_range
            };
            
            // Track global date range
            if (result.data.date_range && result.data.date_range.start) {
              const start = new Date(result.data.date_range.start);
              if (!globalMinDate || start < globalMinDate) globalMinDate = start;
            }
            if (result.data.date_range && result.data.date_range.end) {
              const end = new Date(result.data.date_range.end);
              if (!globalMaxDate || end > globalMaxDate) globalMaxDate = end;
            }
          }
        }
      });
      
      setGrowthMetrics(aggregated);
    } catch (error) {
      console.error('Error fetching CV growth metrics:', error);
      setGrowthMetrics({});
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDetections(), fetchGrowthMetrics()]);
    };
    loadData();

    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'error';
    if (confidence >= 0.6) return 'warning';
    return 'info';
  };

  const getDetectionIcon = (confidence) => {
    if (confidence >= 0.8) return <ErrorIcon sx={{ fontSize: 20 }} />;
    if (confidence >= 0.6) return <WarningIcon sx={{ fontSize: 20 }} />;
    return <BugReportIcon sx={{ fontSize: 20 }} />;
  };

  const formatDetectionLabel = (label) => {
    return label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const zoneList = Object.entries(growthMetrics).map(([zoneId, payload]) => ({
    zoneId,
    metrics: payload?.growth_metrics || {}
  }));

  const sumMetric = (metricKey) => {
    return zoneList.reduce((sum, zone) => {
      const value = zone.metrics?.[metricKey];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  const topZoneForMetric = (metricKey) => {
    let maxValue = -Infinity;
    let topZone = null;
    zoneList.forEach(zone => {
      const value = zone.metrics?.[metricKey];
      if (typeof value === 'number' && value > maxValue) {
        maxValue = value;
        topZone = { zone: zone.zoneId, value };
      }
    });
    return topZone && maxValue > 0 ? topZone : null;
  };

  const formatZone = (zoneId) => zoneId?.replace('PV_Zone_', 'Zone ');

  const summarizeDetections = (keywords = []) => {
    if (!detections.length || !keywords.length) return null;
    const lowered = keywords.map(k => k.toLowerCase());
    const perZone = {};
    let total = 0;

    detections.forEach(detection => {
      const label = detection.label?.toLowerCase() || '';
      if (lowered.some(keyword => label.includes(keyword))) {
        total += detection.count;
        perZone[detection.zone_id] = (perZone[detection.zone_id] || 0) + detection.count;
      }
    });

    if (total === 0) return null;

    const sortedZones = Object.entries(perZone).sort((a, b) => b[1] - a[1]);
    const [topZoneId, topValue] = sortedZones[0];

    return {
      total,
      topZone: { zone: topZoneId, value: topValue },
    };
  };

  const fallenFruitTotal = sumMetric('fallen_pear_count');
  const fallenFruitLeader = topZoneForMetric('fallen_pear_count');
  const trimmingTotal = sumMetric('trimming_count');
  const trimmingZones = zoneList
    .filter(zone => typeof zone.metrics?.trimming_count === 'number' && zone.metrics.trimming_count > 0)
    .map(zone => `${formatZone(zone.zoneId)} (${zone.metrics.trimming_count})`);

  // Prioritize growth_metrics over detections for fallen fruits (growth_metrics don't have confidence scores)
  // Only use detections if growth_metrics are not available
  const fallenDetectionSummary = summarizeDetections(['fallen']);
  const trimmingDetectionSummary = summarizeDetections(['trim', 'prun']);

  // For fallen fruits: prefer growth_metrics (no confidence) over detections (may have 0% confidence)
  const effectiveFallenTotal = fallenFruitTotal > 0 ? fallenFruitTotal : (fallenDetectionSummary?.total ?? 0);
  const effectiveFallenLeader = fallenFruitLeader ? fallenFruitLeader : (fallenDetectionSummary?.topZone ?? null);

  const effectiveTrimmingTotal = trimmingDetectionSummary?.total ?? trimmingTotal;
  const effectiveTrimmingZones = trimmingDetectionSummary
    ? [formatZone(trimmingDetectionSummary.topZone.zone)]
    : trimmingZones;

  if (loading) {
    return (
      <Card sx={{ height: '100%', ...cardProps.sx }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            System-wide Detections
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', ...cardProps.sx }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          System-wide Detections
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1, mb: 1.5 }}>
          Aggregated CV detections across all zones.
        </Typography>

        {/* Detection Summary */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`Today: ${summary.today}`} 
              size="small" 
              color={summary.today > 0 ? 'warning' : 'default'}
            />
            {summary.week > 0 && (
              <Chip 
                label={`Past 7d: ${summary.week}`} 
                size="small" 
                variant="outlined"
              />
            )}
            {!!detections.length && (
              <Chip
                label={`Historical total: ${detections.reduce((acc, d) => acc + d.count, 0)}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
          {dateRange && (
            <Typography variant="caption" color="text.secondary">
              Showing CV detections from{' '}
              {formatDateRange(dateRange.start, dateRange.end)}
              {dateRange.isStale && ' • Data older than 7 days'}
            </Typography>
          )}
        </Box>

        {detections.length === 0 ? (
          <Box sx={{ py: 1, textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No detections available yet
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {detections.map((detection, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  px: 1, 
                  py: 0.5,
                  borderLeft: 3,
                  borderColor: `${getConfidenceColor(detection.max_confidence)}.main`,
                  mb: 0.5,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: `${getConfidenceColor(detection.max_confidence)}.main`,
                  mr: 1 
                }}>
                  {getDetectionIcon(detection.max_confidence)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDetectionLabel(detection.label)}
                      </Typography>
                      <Chip 
                        label={detection.zone_id.replace('PV_Zone_', 'Zone ')} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {detection.count} detection{detection.count > 1 ? 's' : ''} • 
                      {' '}{Math.round(detection.max_confidence * 100)}% confidence
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Fallen Fruits Section */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Fallen Fruits
          </Typography>
          {dateRange && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Recent window ({RECENT_WINDOW_DAYS} days): {formatDateRange(dateRange.start, dateRange.end)}
            </Typography>
          )}
          {effectiveFallenTotal === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ✓ No fallen fruit detections available in the recent window.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Recent detections:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{effectiveFallenTotal}</Typography>
              </Box>
              {effectiveFallenLeader && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Hotspot:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {formatZone(effectiveFallenLeader.zone)} ({effectiveFallenLeader.value})
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Trimming Section */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Trimming
          </Typography>
          {effectiveTrimmingTotal === 0 ? (
            <Typography variant="body2" color="text.secondary">
              ✓ No trimming tasks detected in the recent window.
            </Typography>
          ) : (
            <>
              <Box>
                <Typography variant="caption" color="text.secondary">Pending Actions:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {effectiveTrimmingTotal} area{effectiveTrimmingTotal > 1 ? 's' : ''} flagged
                </Typography>
              </Box>
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Zones:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {effectiveTrimmingZones.length ? effectiveTrimmingZones.join(', ') : 'N/A'}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Recommendations */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            Recommendations:
          </Typography>
          {detections.length > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {detections.filter(d => d.max_confidence >= 0.8).length > 0 
                ? '⚠️ High confidence detections require immediate inspection'
                : '✓ Monitor affected zones and consider preventive measures'}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              ✓ No active disease concerns detected
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DiseaseMonitoringPanel;

