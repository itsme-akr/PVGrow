import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Spa as SpaIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  Apple as FruitIcon,
  Straighten as SizeIcon,
  Palette as ColorIcon,
} from '@mui/icons-material';
import { getAllImageAnalysesForZone } from '../services/api.js';
import { formatDate, formatDateRange } from '../utils/dateFormat.js';

const GrowthAndFruitMetricsCard = ({ zoneId }) => {
  const [growthData, setGrowthData] = useState(null);
  const [fruitData, setFruitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchAllMetrics();
  }, [zoneId]);

  const fetchAllMetrics = async () => {
    try {
      setLoading(true);
      const response = await getAllImageAnalysesForZone(zoneId);
      const allAnalyses = (response.data && response.data.analyses) ? response.data.analyses : [];

      const RECENT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
      const now = new Date();
      const recentAnalyses = allAnalyses.filter(a => {
        const tsString = a.timestamp || a.created_at;
        if (!tsString) return false;
        const ts = new Date(tsString);
        if (Number.isNaN(ts.getTime())) return false;
        return now - ts <= RECENT_WINDOW_MS;
      });

      const analysesForAggregation = recentAnalyses;

      if (analysesForAggregation.length === 0) {
        setError('No recent data found');
        setGrowthData(null);
        setFruitData(null);
        setDateRange(null);
        return;
      }

      if (analysesForAggregation.length > 0) {
        const allMetrics = analysesForAggregation
          .map(a => a.growth_metrics)
          .filter(m => m !== null && m !== undefined);

        if (allMetrics.length > 0) {
          // Process Growth Metrics
          const latestAnalysis = [...analysesForAggregation]
            .reverse()
            .find(a => a.growth_metrics !== null && a.growth_metrics !== undefined);
          
          const growthSpeeds = allMetrics
            .map(m => m.growth_speed)
            .filter(s => typeof s === 'number' && !isNaN(s));
          
          const latestGm = latestAnalysis?.growth_metrics;
          
          const isAllZeros = (
            (!latestGm?.growth_speed || latestGm.growth_speed === 0) &&
            (!latestGm?.fruit_count || latestGm.fruit_count === 0) &&
            (!latestGm?.average_fruit_size || latestGm.average_fruit_size === 0)
          );
          
          const finalStage = (isAllZeros && latestGm?.stage && latestGm.stage !== 'off-season')
            ? 'off-season'
            : (latestGm?.stage || 'dormancy');
          
          setGrowthData({
            stage: finalStage,
            growth_speed: growthSpeeds.length > 0
              ? growthSpeeds.reduce((sum, s) => sum + s, 0) / growthSpeeds.length
              : latestGm?.growth_speed || 0,
            optimal_harvest_time: latestGm?.optimal_harvest_time || null,
            pear_growth_slowdown_date: latestGm?.pear_growth_slowdown_date || null,
            frost: latestGm?.frost || null,
            hail: latestGm?.hail || null,
          });

          // Process Fruit Metrics
          const aggregated = {
            fruit_count: allMetrics.reduce((sum, m) => sum + (Number(m.fruit_count) || 0), 0),
            cluster_count: allMetrics.reduce((sum, m) => sum + (Number(m.cluster_count) || 0), 0),
            cracked_pear_count: allMetrics.reduce((sum, m) => sum + (Number(m.cracked_pear_count) || 0), 0),
            rust_count: allMetrics.reduce((sum, m) => sum + (Number(m.rust_count) || 0), 0),
            fallen_pear_count: allMetrics.reduce((sum, m) => sum + (Number(m.fallen_pear_count) || 0), 0),
            trimming_count: allMetrics.reduce((sum, m) => sum + (Number(m.trimming_count) || 0), 0),
            blossom_area_coverage: allMetrics.length > 0 
              ? allMetrics
                  .filter(m => typeof m.blossom_area_coverage === 'number')
                  .reduce((sum, m) => sum + m.blossom_area_coverage, 0) / 
                  Math.max(1, allMetrics.filter(m => typeof m.blossom_area_coverage === 'number').length)
              : 0,
          };
          
          const sizeData = allMetrics
            .filter(m => typeof m.average_fruit_size === 'number' && typeof m.fruit_count === 'number' && m.fruit_count > 0)
            .map(m => ({ size: m.average_fruit_size, count: m.fruit_count }));
          
          if (sizeData.length > 0) {
            const totalCount = sizeData.reduce((sum, d) => sum + d.count, 0);
            aggregated.average_fruit_size = sizeData.reduce((sum, d) => sum + (d.size * d.count), 0) / totalCount;
          } else {
            const sizes = allMetrics
              .map(m => m.average_fruit_size)
              .filter(s => typeof s === 'number' && !isNaN(s));
            aggregated.average_fruit_size = sizes.length > 0 
              ? sizes.reduce((sum, s) => sum + s, 0) / sizes.length 
              : 0;
          }
          
          const latestWithColor = [...analysesForAggregation]
            .reverse()
            .find(a => a.growth_metrics?.average_fruit_color);
          aggregated.average_fruit_color = latestWithColor?.growth_metrics?.average_fruit_color || null;
          
          setFruitData(aggregated);

          const timestamps = analysesForAggregation
            .map(a => a.timestamp || a.created_at)
            .filter(Boolean)
            .map(ts => new Date(ts))
            .filter(d => !Number.isNaN(d.getTime()))
            .sort((a, b) => a - b);

          if (timestamps.length > 0) {
            setDateRange({
              start: timestamps[0].toISOString(),
              end: timestamps[timestamps.length - 1].toISOString(),
            });
          } else {
            setDateRange(null);
          }
          setError(null);
        } else {
          setError('No recent data found');
          setGrowthData(null);
          setFruitData(null);
          setDateRange(null);
        }
      } else {
        setError('No recent data found');
        setGrowthData(null);
        setFruitData(null);
        setDateRange(null);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('No data available yet');
      setGrowthData(null);
      setFruitData(null);
      setDateRange(null);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      blooming: '#FF69B4',
      growing: '#4CAF50',
      ripening: '#FFA500',
      harvesting: '#FF5722',
      'off-season': '#9E9E9E',
    };
    return colors[stage?.toLowerCase()] || '#9E9E9E';
  };

  const getStageLabel = (stage) => {
    const labels = {
      blooming: 'Blooming',
      growing: 'Growing',
      ripening: 'Ripening',
      harvesting: 'Harvesting',
      'off-season': 'Off-Season',
    };
    return labels[stage?.toLowerCase()] || stage;
  };

  const getDaysUntilHarvest = (harvestDate) => {
    if (!harvestDate) return null;
    try {
      const today = new Date();
      const harvest = new Date(harvestDate);
      const diffTime = harvest - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const getRGBString = (colorObj) => {
    if (!colorObj || !colorObj.r || !colorObj.g || !colorObj.b) {
      return 'rgb(150, 150, 150)';
    }
    return `rgb(${colorObj.r}, ${colorObj.g}, ${colorObj.b})`;
  };

  const getColorDescription = (colorObj) => {
    if (!colorObj || !colorObj.r || !colorObj.g || !colorObj.b) {
      return 'Unknown';
    }
    const { r, g, b } = colorObj;
    if (g > r && g > b) {
      return 'Green (Unripe)';
    } else if (r > 180 && g > 150) {
      return 'Yellow (Ripe)';
    } else if (r > g && r > b) {
      return 'Red (Very Ripe)';
    } else {
      return 'Mixed';
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error || (!growthData && !fruitData)) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Growth & Harvest Prediction</Typography>
          </Box>
          <Alert severity="info">
            {error || 'No data available yet. Data will appear once CV team uploads analysis.'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const daysUntilHarvest = getDaysUntilHarvest(growthData?.optimal_harvest_time);
  const totalDamaged = 
    (fruitData?.cracked_pear_count || 0) + 
    (fruitData?.rust_count || 0) + 
    (fruitData?.fallen_pear_count || 0);
  const healthyFruits = (fruitData?.fruit_count || 0) - totalDamaged;
  const healthPercentage = fruitData?.fruit_count > 0 
    ? ((healthyFruits / fruitData.fruit_count) * 100).toFixed(1)
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* GROWTH METRICS SECTION */}
        {growthData && (
          <Box mb={2}>
            <Box display="flex" alignItems="center" mb={2}>
              <SpaIcon sx={{ mr: 1, fontSize: 22, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">Growth Metrics</Typography>
              {growthData.stage && (
                <Chip 
                  label={getStageLabel(growthData.stage)} 
                  size="small" 
                  sx={{ 
                    marginLeft: 1, 
                    backgroundColor: getStageColor(growthData.stage), 
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              )}
            </Box>
            {dateRange && dateRange.start && dateRange.end && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Data from {formatDateRange(dateRange.start, dateRange.end)}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <SpeedIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">Growth Speed</Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(growthData.growth_speed || 0, 100)} 
                sx={{ 
                  flex: 1, 
                  height: 10, 
                  ml: 2, 
                  mr: 1, 
                  borderRadius: 4, 
                  backgroundColor: '#e0e0e0', 
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4CAF50'
                  }
                }} 
              />
              <Typography variant="body1" fontWeight="bold">{growthData.growth_speed?.toFixed(1) || 0}%</Typography>
            </Box>
            {growthData.optimal_harvest_time && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, backgroundColor: '#f5f5f5', border: '2px solid #4CAF50', borderRadius: 2, my: 1.5 }}>
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                  <CalendarIcon sx={{ mr: 1, fontSize: 20, color: '#4CAF50' }} />
                  <Typography variant="body1" fontWeight="bold">Optimal Harvest Date:</Typography>
                  <Typography variant="body1" color="#4CAF50" fontWeight="bold" sx={{ml:1}}>{formatDate(growthData.optimal_harvest_time)}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {daysUntilHarvest !== null && (
                    daysUntilHarvest > 0
                      ? `${daysUntilHarvest} days remaining`
                      : daysUntilHarvest === 0
                      ? 'Harvest today!'
                      : `${Math.abs(daysUntilHarvest)} days overdue`
                  )}
                </Typography>
              </Box>
            )}
            {growthData.pear_growth_slowdown_date && (
              <Box display="flex" alignItems="center" mt={1}>
                <Typography variant="caption" color="text.secondary" sx={{flex:1}}>Growth Slowdown Detected</Typography>
                <Typography variant="caption" fontWeight="bold">{formatDate(growthData.pear_growth_slowdown_date)}</Typography>
              </Box>
            )}
            {(growthData.frost === 'Detected' || growthData.hail === 'Detected') && (
              <Alert severity="warning" sx={{ mt: 1 }} icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold">Environmental Alerts:</Typography>
                {growthData.frost === 'Detected' && <Typography variant="caption">• Frost damage detected</Typography>}
                {growthData.hail === 'Detected' && <Typography variant="caption">• Hail damage detected</Typography>}
              </Alert>
            )}
          </Box>
        )}
        {/* Divider */}
        {growthData && fruitData && <Divider sx={{ my: 2 }} />}
        {/* FRUIT METRICS SECTION */}
        {fruitData && (
          <Box>
            <Box display="flex" alignItems="center" mb={2}>
              <FruitIcon sx={{ mr: 1, fontSize: 22, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">Fruit Metrics</Typography>
            </Box>
            <Grid container spacing={2.5}>
              {/* Column 1 */}
              <Grid item xs={4}>
                <Box display="flex" flexDirection="column" gap={2} height="100%">
                  <Box display="flex" gap={1.5}>
                    <Box textAlign="center" p={1.5} flex={1} sx={{ backgroundColor: '#f7f7f9', borderRadius: 2 }}>
                      <Typography variant="h5" color="primary" fontWeight="bold" lineHeight={1.2}>{fruitData.fruit_count || 0}</Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1}>Total Fruits</Typography>
                    </Box>
                    <Box textAlign="center" p={1.5} flex={1} sx={{ backgroundColor: '#f7f7f9', borderRadius: 2 }}>
                      <Typography variant="h5" color="secondary" fontWeight="bold" lineHeight={1.2}>{fruitData.cluster_count || 0}</Typography>
                      <Typography variant="body2" color="text.secondary" lineHeight={1}>Clusters</Typography>
                    </Box>
                  </Box>
                  {fruitData.average_fruit_color && (
                    <Box p={1.25} sx={{ backgroundColor: '#f7f7f9', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 1, backgroundColor: getRGBString(fruitData.average_fruit_color), border: '1px solid #ddd', flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" display="block" lineHeight={1}>Avg Color</Typography>
                          <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>{getColorDescription(fruitData.average_fruit_color)}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
              {/* Column 2 */}
              <Grid item xs={4}>
                <Box display="flex" flexDirection="column" gap={2} height="100%">
                  <Box p={1.5} sx={{ backgroundColor: '#f7f7f9', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Avg Size</Typography>
                    <Typography variant="h6" fontWeight="bold">{fruitData.average_fruit_size?.toFixed(1) || 0} px</Typography>
                  </Box>
                  {fruitData.blossom_area_coverage !== undefined && fruitData.blossom_area_coverage !== null && (
                    <Box p={1.5} sx={{ backgroundColor: '#f7f7f9', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Blossom Coverage</Typography>
                      <Typography variant="h6" fontWeight="bold">{fruitData.blossom_area_coverage?.toFixed(1)}%</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              {/* Column 3 */}
              <Grid item xs={4}>
                <Box display="flex" flexDirection="column" gap={2} height="100%">
                  <Box sx={{ p: 1.5, backgroundColor: healthPercentage >= 90 ? '#e8f5e9' : healthPercentage >= 70 ? '#fff3e0' : '#ffebee', borderRadius: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="body2" color="text.secondary" fontWeight="bold">Health</Typography>
                      <Typography variant="body2" color="text.secondary">{healthyFruits}/{fruitData.fruit_count || 0}</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color={healthPercentage >= 90 ? 'success.main' : healthPercentage >= 70 ? 'warning.main' : 'error.main'}>{healthPercentage}%</Typography>
                  </Box>
                  {totalDamaged > 0 && (
                    <Box sx={{ p: 1.5, backgroundColor: '#fff3e0', borderRadius: 2, flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold" mb={0.5} sx={{ display: 'block' }}>Damage Breakdown</Typography>
                      <Box display="flex" flexDirection="column" gap={0.25}>
                        {fruitData.cracked_pear_count > 0 && (
                          <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Cracked</Typography><Typography variant="body2" fontWeight="medium">{fruitData.cracked_pear_count}</Typography></Box>
                        )}
                        {fruitData.rust_count > 0 && (
                          <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Rust</Typography><Typography variant="body2" fontWeight="medium">{fruitData.rust_count}</Typography></Box>
                        )}
                        {fruitData.fallen_pear_count > 0 && (
                          <Box display="flex" justifyContent="space-between"><Typography variant="body2" color="text.secondary">Fallen</Typography><Typography variant="body2" fontWeight="medium">{fruitData.fallen_pear_count}</Typography></Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GrowthAndFruitMetricsCard;
