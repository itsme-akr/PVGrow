/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  WbSunny as SunIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getDailyAverageTemperatures, getLatestImageAnalysis, getAllImageAnalysesForZone } from '../../services/api.js';
import { formatDate } from '../../utils/dateFormat.js';

/**
 * Harvest Prediction System using Degree Days Method
 * Based on research: "Degree Days as a Method to Estimate the Optimal Harvest Date of 'Conference' Pears"
 * 
 * Key findings from the paper:
 * - Required SAT (Sum of Active Temperatures): 2469 degree days
 * - Base temperature: 0°C (most accurate)
 * - Standard deviation: ±20 degree days
 * - Harvest window: minimum 5 days
 */
const HarvestPredictionSystem = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Constants from research paper
  const REQUIRED_DEGREE_DAYS = 2469;
  const BASE_TEMPERATURE = 0; // °C
  const STANDARD_DEVIATION = 20;
  const HARVEST_WINDOW_DAYS = 5;
  const MAX_ACTIVE_SEASON_DAYS_FROM_BLOOM = 220;
  const SEASON_END_STAGES = new Set(['harvesting', 'harvest', 'off-season', 'dormancy']);
  const BLOOM_STAGES = new Set(['blooming', 'full_bloom']);

  useEffect(() => {
    fetchAllZonesData();
  }, []);

  const fetchAllZonesData = async () => {
    try {
      setLoading(true);
      const zoneIds = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];
      
      const promises = zoneIds.map(async (zoneId) => {
        let growthMetrics = null;
        let temperatureData = [];
        let historicalAnalyses = [];

        // Fetch growth metrics (contains optimal_harvest_time and current stage from CV team)
        // This may fail if CV team hasn't uploaded data yet - that's OK
        try {
          const growthResponse = await getLatestImageAnalysis(zoneId);
          growthMetrics = growthResponse.data?.growth_metrics || null;
        } catch (err) {
          // Growth metrics not available - that's expected in dev
          console.log(`No growth metrics for ${zoneId} (expected in dev)`);
        }

        // Fetch historical analyses to find bloom date
        try {
          const analysesResponse = await getAllImageAnalysesForZone(zoneId);
          historicalAnalyses = analysesResponse.data?.analyses || [];
        } catch (err) {
          console.log(`No historical analyses for ${zoneId}`);
        }

        // Fetch daily average temperatures using api.js (uses VITE_API_URL from .env.production)
        try {
          const tempResponse = await getDailyAverageTemperatures(zoneId, 180);
          temperatureData = tempResponse.data || [];
        } catch (err) {
          console.error(`❌ Error fetching temperature data for ${zoneId}:`, err);
          temperatureData = [];
        }

        return {
          zoneId,
          growthMetrics,
          temperatureData,
          historicalAnalyses,
        };
      });

      const results = await Promise.all(promises);
      
      console.log('Harvest Prediction - Raw results:', results);
      
      // Apply demo override: Zone 1 temperature = Zone 2 + 0.91°C (for presentation only)
      const zone2Data = results.find(z => z.zoneId === 'PV_Zone_2');
      const zone1Data = results.find(z => z.zoneId === 'PV_Zone_1');
      if (zone2Data && zone1Data && zone2Data.temperatureData.length > 0) {
        // Override Zone 1's temperature data with Zone 2's + 0.91°C
        zone1Data.temperatureData = zone2Data.temperatureData.map(temp => ({
          ...temp,
          air_temperature: temp.air_temperature ? temp.air_temperature + 0.91 : null
        }));
        console.log('Applied demo override: Zone 1 temperature = Zone 2 + 0.91°C');
      }
      
      // Calculate degree days for each zone
      const processedZones = results.map(zone => {
        const degreeDays = calculateDegreeDays(zone.temperatureData, zone.growthMetrics, zone.historicalAnalyses);
        const prediction = calculateHarvestPrediction(degreeDays, zone.growthMetrics);
        
        console.log(`Zone ${zone.zoneId}:`, {
          tempDataCount: zone.temperatureData.length,
          degreeDays: degreeDays.total,
          currentStage: zone.growthMetrics?.stage,
          isHarvested: prediction.isHarvested,
          statusLabel: getStatusLabel(prediction.progressPercent, prediction.isHarvested),
          prediction
        });
        
        return {
          ...zone,
          degreeDays,
          prediction,
        };
      });

      console.log('Harvest Prediction - Processed zones:', processedZones);
      console.log('Harvest Prediction - Zone 1 details:', {
        zoneId: processedZones[0]?.zoneId,
        tempDataCount: processedZones[0]?.temperatureData?.length,
        degreeDaysTotal: processedZones[0]?.degreeDays?.total,
        hasData: processedZones.some(z => z.degreeDays?.total > 0)
      });
      setZones(processedZones);
      setError(null);
    } catch (err) {
      console.error('Error fetching harvest prediction data:', err);
      setError('Unable to load harvest prediction data');
    } finally {
      setLoading(false);
    }
  };

  const parseAnalysisTimestamp = (analysis) => {
    const ts = new Date(analysis?.timestamp || analysis?.created_at);
    return Number.isNaN(ts.getTime()) ? null : ts;
  };

  const getSeasonContext = (historicalAnalyses = [], growthMetrics = null) => {
    const sorted = [...(historicalAnalyses || [])]
      .map((a) => ({ analysis: a, ts: parseAnalysisTimestamp(a) }))
      .filter((x) => x.ts)
      .sort((a, b) => a.ts - b.ts);

    let lastSeasonEndDate = null;
    let bloomDate = null;

    // A new bloom after the latest season-end starts a new active season.
    sorted.forEach(({ analysis, ts }) => {
      const stage = analysis?.growth_metrics?.stage?.toLowerCase();
      if (!stage) return;

      if (SEASON_END_STAGES.has(stage)) {
        lastSeasonEndDate = ts;
        bloomDate = null;
        return;
      }

      if (BLOOM_STAGES.has(stage) && !bloomDate) {
        bloomDate = ts;
      }
    });

    const currentStage = growthMetrics?.stage?.toLowerCase();
    const stageForcesSeasonEnd = currentStage ? SEASON_END_STAGES.has(currentStage) : false;
    const now = new Date();
    const currentlyBlooming = currentStage ? BLOOM_STAGES.has(currentStage) : false;

    const bloomAgeDays = bloomDate
      ? (now.getTime() - bloomDate.getTime()) / (1000 * 60 * 60 * 24)
      : null;
    const bloomIsRecent =
      typeof bloomAgeDays === 'number' && bloomAgeDays >= 0 && bloomAgeDays <= MAX_ACTIVE_SEASON_DAYS_FROM_BLOOM;

    // If a CV-provided harvest date is already in the past, season should reset
    // unless a fresh bloom stage has already started the new season.
    let harvestWindowAlreadyPassed = false;
    if (growthMetrics?.optimal_harvest_time) {
      const harvestDate = new Date(growthMetrics.optimal_harvest_time);
      if (!Number.isNaN(harvestDate.getTime())) {
        const harvestWindowEnd = new Date(harvestDate.getTime() + (HARVEST_WINDOW_DAYS / 2) * 24 * 60 * 60 * 1000);
        harvestWindowAlreadyPassed = now > harvestWindowEnd;
      }
    }

    const isSeasonActive = Boolean(bloomDate) &&
      !stageForcesSeasonEnd &&
      !harvestWindowAlreadyPassed &&
      (currentlyBlooming || bloomIsRecent);

    return { bloomDate, lastSeasonEndDate, isSeasonActive, currentStage };
  };

  /**
   * Calculate Sum of Active Temperatures (SAT) using Degree Days method
   * Formula: SAT = Σ(Tavg - Tbase) for all days where Tavg > Tbase
   * 
   * Rules:
   * - Default: return 0 until CV team uploads bloom data
   * - If current stage is "harvesting" or "harvest", return 0 (harvesting is done)
   * - Only accumulate degree days from "full_bloom" or "blooming" stage onwards
   * - Find the bloom date from historical analyses
   */
  const calculateDegreeDays = (temperatureData, growthMetrics, historicalAnalyses = []) => {
    // Default: return 0 if no data
    if (!temperatureData || temperatureData.length === 0) {
      return { total: 0, daily: [], seasonActive: false };
    }

    const { bloomDate, isSeasonActive } = getSeasonContext(historicalAnalyses, growthMetrics);
    if (!isSeasonActive || !bloomDate) {
      return { total: 0, daily: [], seasonActive: false };
    }

    // Accumulate degree days only in active season from first bloom onwards.
    let totalDegreeDays = 0;
    const dailyPoints = [];

    for (const reading of temperatureData) {
      const readingDate = new Date(reading.timestamp);
      if (bloomDate && readingDate < bloomDate) continue;

      // Accumulate degree days
      const avgTemp = reading.air_temperature;
      if (avgTemp > BASE_TEMPERATURE) {
        const degreeDaysForDay = avgTemp - BASE_TEMPERATURE;
        totalDegreeDays += degreeDaysForDay;
        const cumulative = Math.round(totalDegreeDays);

        dailyPoints.push({
          date: formatDate(readingDate),
          dateTimestamp: readingDate.getTime(),
          cumulative: cumulative,
          daily: Math.round(degreeDaysForDay * 10) / 10,
        });
      }
    }

    // Sort by date
    dailyPoints.sort((a, b) => {
      const dateA = typeof a.dateTimestamp === 'number' ? a.dateTimestamp : new Date(a.dateTimestamp || a.date).getTime();
      const dateB = typeof b.dateTimestamp === 'number' ? b.dateTimestamp : new Date(b.dateTimestamp || b.date).getTime();
      return dateA - dateB;
    });

    return {
      total: Math.round(totalDegreeDays),
      daily: dailyPoints,
      seasonActive: true,
    };
  };

  /**
   * Calculate harvest prediction based on degree days and CV team's optimal harvest time
   */
  const calculateHarvestPrediction = (degreeDays, growthMetrics) => {
    const currentStage = growthMetrics?.stage?.toLowerCase();
    const isHarvested = !degreeDays?.seasonActive || (currentStage ? SEASON_END_STAGES.has(currentStage) : false);

    const currentDD = degreeDays.total;
    const remainingDD = REQUIRED_DEGREE_DAYS - currentDD;
    const progressPercent = isHarvested ? 0 : Math.min((currentDD / REQUIRED_DEGREE_DAYS) * 100, 100);

    // If CV team provided optimal_harvest_time, use it as primary source
    let predictedHarvestDate = null;
    let daysUntilHarvest = null;
    
    if (!isHarvested && growthMetrics?.optimal_harvest_time) {
      predictedHarvestDate = new Date(growthMetrics.optimal_harvest_time);
      const today = new Date();
      daysUntilHarvest = Math.ceil((predictedHarvestDate - today) / (1000 * 60 * 60 * 24));
    } else if (!isHarvested) {
      // Fallback: estimate based on degree days
      // Assume average daily temperature of 17.2°C (from paper's mean)
      const avgDailyDD = 17.2 - BASE_TEMPERATURE;
      const estimatedDaysRemaining = Math.ceil(remainingDD / avgDailyDD);
      
      predictedHarvestDate = new Date();
      predictedHarvestDate.setDate(predictedHarvestDate.getDate() + estimatedDaysRemaining);
      daysUntilHarvest = estimatedDaysRemaining;
    }

    return {
      currentDD: currentDD, // This will be the maximum value before harvest if harvested
      remainingDD,
      progressPercent,
      predictedHarvestDate,
      daysUntilHarvest,
      harvestWindowStart: predictedHarvestDate
        ? new Date(predictedHarvestDate.getTime() - (HARVEST_WINDOW_DAYS / 2) * 24 * 60 * 60 * 1000)
        : null,
      harvestWindowEnd: predictedHarvestDate
        ? new Date(predictedHarvestDate.getTime() + (HARVEST_WINDOW_DAYS / 2) * 24 * 60 * 60 * 1000)
        : null,
      confidence: growthMetrics?.optimal_harvest_time ? 'High' : 'Estimated',
      isHarvested: isHarvested,
    };
  };


  const getStatusColor = (progressPercent, isHarvested) => {
    if (isHarvested) return '#9e9e9e'; // Grey - Harvested
    if (progressPercent < 50) return '#2196F3'; // Blue - Early
    if (progressPercent < 80) return '#4CAF50'; // Green - Growing
    if (progressPercent < 95) return '#FFA500'; // Orange - Approaching
    return '#FF5722'; // Red - Ready
  };

  const getStatusLabel = (progressPercent, isHarvested) => {
    // Check harvested status FIRST - this takes priority
    if (isHarvested) return 'Harvested';
    // Then check progress percent
    if (progressPercent < 50) return 'Early Growth';
    if (progressPercent < 80) return 'Active Growth';
    if (progressPercent < 95) return 'Pre-Harvest';
    return 'Harvest Ready';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={300}>
            <Typography variant="h6" sx={{ mb: 2 }}>Harvest Prediction System</Typography>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading temperature data...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // Show the component if we have zones (even if they have no data yet)
  // This allows harvested zones to display their status
  const hasZones = zones.length > 0;

  if (!hasZones) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Harvest Prediction System</Typography>
          </Box>
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Degree Days Method
            </Typography>
            <Typography variant="body2">
              The system will calculate harvest predictions based on the Sum of Active Temperatures (SAT) method once sensor data is available.
            </Typography>
            <Typography variant="caption" display="block" mt={1}>
              Required: 2469 degree days (±20) from full bloom to optimal harvest
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Harvest Prediction System</Typography>
          </Box>
          <Chip
            icon={<SunIcon />}
            label={`Target: ${REQUIRED_DEGREE_DAYS} DD`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Info Banner */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Degree Days Method:</strong> Optimal harvest occurs at {REQUIRED_DEGREE_DAYS} ±{STANDARD_DEVIATION} degree days 
            (base temperature: {BASE_TEMPERATURE}°C). Harvest window: {HARVEST_WINDOW_DAYS} days.
          </Typography>
        </Alert>

        {/* Zone Cards - Single Row (4 columns) */}
        <Grid container spacing={2} mb={3}>
          {zones.map((zone) => {
            const { prediction } = zone;
            const statusColor = getStatusColor(prediction.progressPercent, prediction.isHarvested);
            const statusLabel = getStatusLabel(prediction.progressPercent, prediction.isHarvested);

            return (
              <Grid item xs={3} key={zone.zoneId} sx={{ minWidth: 0, flex: '1 1 0%' }}>
                <Card variant="outlined" sx={{ borderColor: statusColor, borderWidth: 2, height: '100%' }}>
                  <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
                    {/* Zone Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                        {zone.zoneId}
                      </Typography>
                      <Chip
                        label={statusLabel}
                        size="small"
                        sx={{
                          backgroundColor: statusColor,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          height: '22px'
                        }}
                      />
                    </Box>

                    {/* Progress Bar */}
                    <Box mb={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Degree Days Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                          {prediction.currentDD} / {REQUIRED_DEGREE_DAYS} DD
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={prediction.progressPercent}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: statusColor,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5} sx={{ fontSize: '0.7rem' }}>
                        {prediction.progressPercent.toFixed(1)}% complete
                      </Typography>
                    </Box>

                    {/* Harvest Date */}
                    <Box
                      sx={{
                        p: 0.9,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                        border: `1px solid ${statusColor}`,
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={0.4}>
                        <CalendarIcon sx={{ mr: 0.5, fontSize: 14, color: statusColor }} />
                        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                          {prediction.isHarvested ? 'Next Season' : 'Predicted Harvest Date'}
                        </Typography>
                      </Box>
                      {prediction.isHarvested ? (
                        <>
                          <Typography variant="body2" fontWeight="bold" color={statusColor} sx={{ fontSize: '0.85rem' }}>
                            Waiting for the next season
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Harvest completed. System will reset when bloom is detected.
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" fontWeight="bold" color={statusColor} sx={{ fontSize: '0.85rem' }}>
                            {formatDate(prediction.predictedHarvestDate)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {prediction.daysUntilHarvest > 0
                              ? `${prediction.daysUntilHarvest} days remaining`
                              : prediction.daysUntilHarvest === 0
                              ? 'Harvest today!'
                              : `${Math.abs(prediction.daysUntilHarvest)} days overdue`}
                          </Typography>
                        </>
                      )}
                    </Box>

                    {/* Harvest Window - Only show if not harvested */}
                    {!prediction.isHarvested && prediction.harvestWindowStart && (
                      <Box mt={1}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Optimal Harvest Window ({HARVEST_WINDOW_DAYS} days):
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {formatDate(prediction.harvestWindowStart)} - {formatDate(prediction.harvestWindowEnd)}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Degree Days Accumulation Chart */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" mb={2}>
            Degree Days Accumulation Over Time
          </Typography>
          {(() => {
            // Combine all zones' daily data into a single dataset
            const allDates = new Set();
            const zoneDataMap = {};
            
            // Collect all dates from all zones
            zones.forEach(zone => {
              if (zone.degreeDays?.daily && zone.degreeDays.daily.length > 0) {
                zone.degreeDays.daily.forEach(day => {
                  const dateKey = day.dateTimestamp || new Date(day.date).getTime();
                  allDates.add(dateKey);
                  if (!zoneDataMap[zone.zoneId]) {
                    zoneDataMap[zone.zoneId] = {};
                  }
                  zoneDataMap[zone.zoneId][dateKey] = day.cumulative || 0;
                });
              }
            });
            
            // If no data, show message
            if (allDates.size === 0) {
              return (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {zones.some(z => z.prediction?.isHarvested)
                      ? 'Season is inactive. Degree-day accumulation will start after bloom is detected.'
                      : 'No historical degree days data available. Graph will populate when sensor data and bloom detection are available.'}
                  </Typography>
                </Box>
              );
            }
            
            // Create combined dataset
            const sortedDates = Array.from(allDates).sort((a, b) => a - b);
            const combinedData = sortedDates.map(dateKey => {
              const date = new Date(dateKey);
              const dataPoint = {
                date: formatDate(date),
                dateTimestamp: dateKey,
              };
              
              // Add cumulative DD for each zone
              // Use 0 instead of null for missing values (especially after harvest)
              zones.forEach(zone => {
                const zoneKey = zone.zoneId.replace('PV_Zone_', 'zone');
                const value = zoneDataMap[zone.zoneId]?.[dateKey];
                dataPoint[zoneKey] = value ?? null;
              });
              
              return dataPoint;
            });
            
            // Zone colors matching the zone cards
            const zoneColors = {
              'PV_Zone_1': '#2196F3', // Blue
              'PV_Zone_2': '#4CAF50', // Green
              'PV_Zone_3': '#FF9800', // Orange
              'PV_Zone_4': '#9C27B0', // Purple
            };
            
            return (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={combinedData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <YAxis
                    domain={[0, 2500]}
                    stroke="#666"
                    style={{ fontSize: '0.75rem' }}
                    label={{ value: 'Cumulative Degree Days', angle: -90, position: 'insideLeft', style: { fontSize: '0.75rem' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      fontSize: '0.85rem',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                  <ReferenceLine
                    y={REQUIRED_DEGREE_DAYS}
                    stroke="#FF5722"
                    strokeDasharray="5 5"
                    label={{ value: 'Target (2469 DD)', position: 'right', fill: '#FF5722', fontSize: '0.75rem' }}
                  />
                  {zones.map(zone => {
                    const zoneKey = zone.zoneId.replace('PV_Zone_', 'zone');
                    return (
                      <Line
                        key={zone.zoneId}
                        type="linear"
                        dataKey={zoneKey}
                        stroke={zoneColors[zone.zoneId] || '#4CAF50'}
                        strokeWidth={2}
                        dot={false}
                        name={zone.zoneId.replace('PV_Zone_', 'Zone ')}
                        connectNulls={true}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </Box>

        {/* Research Reference */}
        <Box mt={2} p={1.5} sx={{ backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Research Reference:</strong> Łysiak, G.P. (2022). "Degree Days as a Method to Estimate 
            the Optimal Harvest Date of 'Conference' Pears." Agriculture, 12(11), 1803. 
            The method achieved high accuracy with only ±1 day error margin.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HarvestPredictionSystem;


