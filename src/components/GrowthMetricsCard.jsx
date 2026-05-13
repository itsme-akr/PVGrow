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
} from '@mui/material';
import {
  Spa as SpaIcon,
  CalendarToday as CalendarIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getAllImageAnalysesForZone, getLatestImageAnalysis } from '../services/api.js';
import { formatDate, formatDateRange } from '../utils/dateFormat.js';

const GrowthMetricsCard = ({ zoneId }) => {
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchGrowthMetrics();
  }, [zoneId]);

  const fetchGrowthMetrics = async () => {
    try {
      setLoading(true);
      // Fetch all historical analyses to aggregate data
      const response = await getAllImageAnalysesForZone(zoneId);

      const allAnalyses = (response.data && response.data.analyses) ? response.data.analyses : [];

      // Restrict to last 6 months based on CV timestamp (or created_at as fallback)
      const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
      const now = new Date();
      const recentAnalyses = allAnalyses.filter(a => {
        const tsString = a.timestamp || a.created_at;
        if (!tsString) return false;
        const ts = new Date(tsString);
        if (Number.isNaN(ts.getTime())) return false;
        return now - ts <= SIX_MONTHS_MS;
      });

      const analysesForAggregation = recentAnalyses.length > 0 ? recentAnalyses : allAnalyses;

      if (analysesForAggregation.length > 0) {
        // Get all analyses with growth_metrics (even partial data)
        const allMetrics = analysesForAggregation
          .map(a => a.growth_metrics)
          .filter(m => m !== null && m !== undefined);
        
        if (allMetrics.length > 0) {
          // Get the most recent analysis for current state
          const latestAnalysis = [...analysesForAggregation]
            .reverse()
            .find(a => a.growth_metrics !== null && a.growth_metrics !== undefined);
          
          // Calculate average growth speed from all analyses
          const growthSpeeds = allMetrics
            .map(m => m.growth_speed)
            .filter(s => typeof s === 'number' && !isNaN(s));
          
          // Aggregate data - use latest values where available, fallback to defaults
          const latestGm = latestAnalysis?.growth_metrics;
          
          // Check if all values are zero (should be treated as off-season/dormancy)
          const isAllZeros = (
            (!latestGm?.growth_speed || latestGm.growth_speed === 0) &&
            (!latestGm?.fruit_count || latestGm.fruit_count === 0) &&
            (!latestGm?.average_fruit_size || latestGm.average_fruit_size === 0)
          );
          
          // If all values are zero, treat as off-season regardless of stage field
          const finalStage = (isAllZeros && latestGm?.stage && latestGm.stage !== 'off-season')
            ? 'off-season'
            : (latestGm?.stage || 'dormancy');
          
          const aggregated = {
            stage: finalStage,
            growth_speed: growthSpeeds.length > 0
              ? growthSpeeds.reduce((sum, s) => sum + s, 0) / growthSpeeds.length
              : latestGm?.growth_speed || 0,
            optimal_harvest_time: latestGm?.optimal_harvest_time || null,
            pear_growth_slowdown_date: latestGm?.pear_growth_slowdown_date || null,
            frost: latestGm?.frost || null,
            hail: latestGm?.hail || null,
          };
          
          setGrowthData(aggregated);

          // Compute effective date range from the analyses we actually used
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
          // No growth_metrics found in history for this zone - fall back to latest single analysis if available
          const latestResponse = await getLatestImageAnalysis(zoneId);
          const latest = latestResponse.data;

          if (latest && latest.growth_metrics) {
            const gm = latest.growth_metrics;
            
            // Check if all values are zero (should be treated as off-season/dormancy)
            const isAllZeros = (
              (!gm.growth_speed || gm.growth_speed === 0) &&
              (!gm.fruit_count || gm.fruit_count === 0) &&
              (!gm.average_fruit_size || gm.average_fruit_size === 0)
            );
            
            // If all values are zero, treat as off-season regardless of stage field
            const finalStage = (isAllZeros && gm.stage && gm.stage !== 'off-season')
              ? 'off-season'
              : (gm.stage || 'dormancy');
            
            setGrowthData({
              stage: finalStage,
              growth_speed: typeof gm.growth_speed === 'number'
                ? gm.growth_speed
                : 0,
              optimal_harvest_time: gm.optimal_harvest_time || null,
              pear_growth_slowdown_date: gm.pear_growth_slowdown_date || null,
              frost: gm.frost || null,
              hail: gm.hail || null,
            });

            const ts = latest.timestamp || latest.created_at;
            if (ts) {
              setDateRange({
                start: ts,
                end: ts,
              });
            } else {
              setDateRange(null);
            }
          } else {
            // Truly no growth metrics anywhere
            setGrowthData(null);
            setDateRange(null);
          }
        }
      } else {
        setGrowthData(null);
        setDateRange(null);
      }
    } catch (err) {
      console.error('Error fetching growth metrics:', err);
      setError('No growth data available yet');
      setGrowthData(null);
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

  if (error || !growthData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SpaIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Growth Metrics</Typography>
          </Box>
          <Alert severity="info">
            {error || 'No growth data available yet. Data will appear once CV team uploads analysis.'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const daysUntilHarvest = getDaysUntilHarvest(growthData.optimal_harvest_time);

  return (
    <Card
      sx={{
        height: '100%',

        overflow: 'hidden',

        borderRadius: '24px',

        background:
          'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',

        border:
          '1px solid rgba(15,23,42,0.06)',
      }}
    >
      <CardContent>
        {/* HEADER */}
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            mb={2.5}
          >
            <Box>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={0.5}
              >
                <SpaIcon
                  sx={{
                    color: '#16a34a',
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Plant Growth Status
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                CV-powered crop growth analytics
                and predictive harvesting insights.
              </Typography>
            </Box>

            <Chip
              label="Live Analytics"
              size="small"
              sx={{
                fontWeight: 700,

                backgroundColor:
                  'rgba(22,163,74,0.10)',

                color: '#15803d',
              }}
            />
          </Box>
                  
        {/* Date Range */}
        {dateRange && dateRange.start && dateRange.end && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Data from {formatDateRange(dateRange.start, dateRange.end)}
          </Typography>
        )}

        <Grid container spacing={2}>
          {/* GROWTH SPEED */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 1.6,

                  borderRadius: '20px',

                  background:
                    'rgba(22,163,74,0.06)',

                  border:
                    '1px solid rgba(22,163,74,0.10)',
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <SpeedIcon
                      sx={{
                        color: '#16a34a',
                      }}
                    />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Growth Performance
                    </Typography>
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,

                      color: '#15803d',
                    }}
                  >
                    {growthData.growth_speed?.toFixed(
                      1
                    ) || 0}
                    %
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min(
                    growthData.growth_speed || 0,
                    100
                  )}
                  sx={{
                    height: 10,

                    borderRadius: '999px',

                    backgroundColor:
                      'rgba(15,23,42,0.06)',

                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#16a34a',
                      borderRadius: '999px',
                    },
                  }}
                />

                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,

                    color: '#166534',
                  }}
                >
                  Stable biological growth detected
                  across current monitoring cycle.
                </Typography>
              </Box>
            </Grid>

          {/* HARVEST PREDICTION */}
          {growthData.optimal_harvest_time && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2.2,

                  borderRadius: '22px',

                  background:
                    'rgba(245,158,11,0.08)',

                  border:
                    '1px solid rgba(245,158,11,0.14)',
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1.5}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <CalendarIcon
                      sx={{
                        color: '#ea580c',
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        color: '#9a3412',
                        fontWeight: 700,
                      }}
                    >
                      Harvest Prediction
                    </Typography>
                  </Box>

                  <Chip
                    label="AI Forecast"
                    size="small"
                    sx={{
                      fontWeight: 700,

                      backgroundColor:
                        'rgba(255,255,255,0.7)',
                    }}
                  />
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,

                    color: '#ea580c',

                    mb: 1,
                  }}
                >
                  {formatDate(
                    growthData.optimal_harvest_time
                  )}
                </Typography>

                {daysUntilHarvest !== null && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#7c2d12',
                    }}
                  >
                    {daysUntilHarvest > 0
                      ? `${daysUntilHarvest} days remaining until optimal harvest`
                      : daysUntilHarvest === 0
                      ? 'Optimal harvest window active today'
                      : `${Math.abs(
                          daysUntilHarvest
                        )} days beyond optimal window`}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          {/* Growth Slowdown Date */}
          {growthData.pear_growth_slowdown_date && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Growth Slowdown Detected
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatDate(growthData.pear_growth_slowdown_date)}
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Frost & Hail Warnings */}
          {(growthData.frost === 'Detected' || growthData.hail === 'Detected') && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 1.8,

                  borderRadius: '18px',

                  background:
                    'rgba(239,68,68,0.08)',

                  border:
                    '1px solid rgba(239,68,68,0.12)',
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >
                  <WarningIcon
                    sx={{
                      color: '#dc2626',
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,

                      color: '#b91c1c',
                    }}
                  >
                    Environmental Alerts
                  </Typography>
                </Box>

                {growthData.frost ===
                  'Detected' && (
                  <Chip
                    label="Frost Damage"
                    size="small"
                    sx={{
                      mr: 1,
                      mb: 1,
                    }}
                  />
                )}

                {growthData.hail ===
                  'Detected' && (
                  <Chip
                    label="Hail Damage"
                    size="small"
                    sx={{
                      mb: 1,
                    }}
                  />
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default GrowthMetricsCard;

