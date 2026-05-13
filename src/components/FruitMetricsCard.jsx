import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Apple as FruitIcon,
  Straighten as SizeIcon,
  Palette as ColorIcon,
  BrokenImage as DamageIcon,
} from '@mui/icons-material';
import { getAllImageAnalysesForZone, getLatestImageAnalysis } from '../services/api.js';
import { formatDateRange } from '../utils/dateFormat.js';

const FruitMetricsCard = ({ zoneId }) => {
  const [fruitData, setFruitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchFruitMetrics();
  }, [zoneId]);

  const fetchFruitMetrics = async () => {
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
        // Aggregate all growth_metrics from all analyses (even if some fields are missing)
        const allMetrics = analysesForAggregation
          .map(a => a.growth_metrics)
          .filter(m => m !== null && m !== undefined);
        
        if (allMetrics.length > 0) {
          // Aggregate totals - sum all numeric values
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
          
          // Calculate average fruit size (weighted by fruit count)
          const sizeData = allMetrics
            .filter(m => typeof m.average_fruit_size === 'number' && typeof m.fruit_count === 'number' && m.fruit_count > 0)
            .map(m => ({ size: m.average_fruit_size, count: m.fruit_count }));
          
          if (sizeData.length > 0) {
            const totalCount = sizeData.reduce((sum, d) => sum + d.count, 0);
            aggregated.average_fruit_size = sizeData.reduce((sum, d) => sum + (d.size * d.count), 0) / totalCount;
          } else {
            // Fallback: simple average if no weighted data
            const sizes = allMetrics
              .map(m => m.average_fruit_size)
              .filter(s => typeof s === 'number' && !isNaN(s));
            aggregated.average_fruit_size = sizes.length > 0 
              ? sizes.reduce((sum, s) => sum + s, 0) / sizes.length 
              : 0;
          }
          
          // Get average color from most recent analysis with color data
          const latestWithColor = [...analysesForAggregation]
            .reverse()
            .find(a => a.growth_metrics?.average_fruit_color);
          aggregated.average_fruit_color = latestWithColor?.growth_metrics?.average_fruit_color || null;
          
          setFruitData(aggregated);
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
          // No growth_metrics found across history - fall back to latest single analysis if available
          const latestResponse = await getLatestImageAnalysis(zoneId);
          const latest = latestResponse.data;

          if (latest && latest.growth_metrics) {
            const m = latest.growth_metrics;
            const aggregated = {
              fruit_count: Number(m.fruit_count) || 0,
              cluster_count: Number(m.cluster_count) || 0,
              cracked_pear_count: Number(m.cracked_pear_count) || 0,
              rust_count: Number(m.rust_count) || 0,
              fallen_pear_count: Number(m.fallen_pear_count) || 0,
              trimming_count: Number(m.trimming_count) || 0,
              blossom_area_coverage: typeof m.blossom_area_coverage === 'number' ? m.blossom_area_coverage : 0,
              average_fruit_size: typeof m.average_fruit_size === 'number' ? m.average_fruit_size : 0,
              average_fruit_color: m.average_fruit_color || null,
            };

            setFruitData(aggregated);

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
            // Truly no fruit metrics anywhere
            setFruitData(null);
            setDateRange(null);
          }
        }
      } else {
        setFruitData(null);
        setDateRange(null);
      }
    } catch (err) {
      console.error('Error fetching fruit metrics:', err);
      setError('No fruit data available yet');
      setFruitData(null);
      setDateRange(null);
    } finally {
      setLoading(false);
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
    
    // Simple color classification for pears
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

  if (error || !fruitData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FruitIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Fruit Metrics</Typography>
          </Box>
          <Alert severity="info">
            {error || 'No fruit data available yet. Data will appear once CV team uploads analysis.'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalDamaged = 
    (fruitData.cracked_pear_count || 0) + 
    (fruitData.rust_count || 0) + 
    (fruitData.fallen_pear_count || 0);

  const healthyFruits = (fruitData.fruit_count || 0) - totalDamaged;
  const healthPercentage = fruitData.fruit_count > 0 
    ? ((healthyFruits / fruitData.fruit_count) * 100).toFixed(1)
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <FruitIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Fruit Metrics</Typography>
          </Box>
        </Box>
        
        {/* Date Range */}
        {dateRange && dateRange.start && dateRange.end && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Data from {formatDateRange(dateRange.start, dateRange.end)}
          </Typography>
        )}

        <Grid container spacing={2}>
          {/* Fruit Count */}
          <Grid item xs={6}>
            <Box textAlign="center" p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h3" color="primary" fontWeight="bold">
                {fruitData.fruit_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Fruits
              </Typography>
            </Box>
          </Grid>

          {/* Cluster Count */}
          <Grid item xs={6}>
            <Box textAlign="center" p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h3" color="secondary" fontWeight="bold">
                {fruitData.cluster_count || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Clusters
              </Typography>
            </Box>
          </Grid>

          {/* Average Fruit Size */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" p={1.5}>
              <Box display="flex" alignItems="center">
                <SizeIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Average Size
                </Typography>
              </Box>
              <Typography variant="body1" fontWeight="bold">
                {fruitData.average_fruit_size?.toFixed(1) || 0} px
              </Typography>
            </Box>
          </Grid>

          {/* Average Fruit Color */}
          <Grid item xs={12}>
            <Box p={1.5}>
              <Box display="flex" alignItems="center" mb={1}>
                <ColorIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Average Color (Ripeness)
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    backgroundColor: getRGBString(fruitData.average_fruit_color),
                    border: '2px solid #ddd',
                  }}
                />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="bold">
                    {getColorDescription(fruitData.average_fruit_color)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    RGB: {fruitData.average_fruit_color?.r || 0}, {fruitData.average_fruit_color?.g || 0}, {fruitData.average_fruit_color?.b || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Fruit Health Status */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={1}>
              <DamageIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" fontWeight="bold">
                Fruit Health
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: healthPercentage >= 90 ? '#e8f5e9' : healthPercentage >= 70 ? '#fff3e0' : '#ffebee',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" fontWeight="bold" color={healthPercentage >= 90 ? 'success.main' : healthPercentage >= 70 ? 'warning.main' : 'error.main'}>
                {healthPercentage}% Healthy
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {healthyFruits} healthy out of {fruitData.fruit_count || 0} total
              </Typography>
            </Box>
          </Grid>

          {/* Damage Breakdown */}
          {totalDamaged > 0 && (
            <Grid item xs={12}>
              <Box sx={{ p: 1.5, backgroundColor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold" mb={1}>
                  Damage Breakdown:
                </Typography>
                {fruitData.cracked_pear_count > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    • Cracked: {fruitData.cracked_pear_count}
                  </Typography>
                )}
                {fruitData.rust_count > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    • Rust: {fruitData.rust_count}
                  </Typography>
                )}
                {fruitData.fallen_pear_count > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    • Fallen: {fruitData.fallen_pear_count}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}

          {/* Blossom Coverage (if available) */}
          {fruitData.blossom_area_coverage !== undefined && fruitData.blossom_area_coverage !== null && (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" p={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Blossom Coverage
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {fruitData.blossom_area_coverage?.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Trimming Needed */}
          {fruitData.trimming_count > 0 && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  {fruitData.trimming_count} area(s) need trimming
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FruitMetricsCard;

