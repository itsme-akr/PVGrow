/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Dot, Area, AreaChart } from 'recharts';
import { getAllImageAnalysesForZone } from '../../services/api.js';
import { getUserSettings, updateUserSettings } from '../../utils/settings.js';

const ZONES = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];
const ZONE_COLORS = {
  PV_Zone_1: { stroke: '#2196F3', fill: 'rgba(33, 150, 243, 0.1)', gradient: ['#2196F3', '#1976D2'] },
  PV_Zone_2: { stroke: '#4CAF50', fill: 'rgba(76, 175, 80, 0.1)', gradient: ['#4CAF50', '#388E3C'] },
  PV_Zone_3: { stroke: '#FF9800', fill: 'rgba(255, 152, 0, 0.1)', gradient: ['#FF9800', '#F57C00'] },
  PV_Zone_4: { stroke: '#9C27B0', fill: 'rgba(156, 39, 176, 0.1)', gradient: ['#9C27B0', '#7B1FA2'] },
};

const TIME_FILTERS = {
  month: { label: 'Monthly', days: 365, groupBy: 'day' }, // 365 days with daily data points
  weekly: { label: 'Weekly', days: 90, groupBy: 'day' },  // 90 days with daily data points
  day: { label: 'Daily', days: 30, groupBy: 'day' },      // 30 days with daily data points
};

const METRIC_OPTIONS = [
  { 
    value: 'average_fruit_size', 
    label: 'Fruit Size', 
    unit: 'px',
    description: 'Average fruit size in pixels',
    color: '#2196F3'
  },
  { 
    value: 'growth_speed', 
    label: 'Growth Speed', 
    unit: '%',
    description: 'Growth speed percentage per day',
    color: '#4CAF50'
  },
  { 
    value: 'fruit_count', 
    label: 'Fruit Count', 
    unit: 'fruits',
    description: 'Total number of detected fruits',
    color: '#FF9800'
  },
  { 
    value: 'blossom_area_coverage', 
    label: 'Blossom Coverage', 
    unit: '%',
    description: 'Blossom area coverage percentage',
    color: '#E91E63'
  },
];

const PlantGrowthStatusChart = ({ cardProps = {} }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState(() => {
    const settings = getUserSettings();
    return settings.defaultGrowthTimeFilter || 'month';
  });
  const [selectedMetric, setSelectedMetric] = useState(() => {
    const settings = getUserSettings();
    return settings.defaultGrowthMetric || 'average_fruit_size';
  });
  const [summaryMetrics, setSummaryMetrics] = useState({
    currentAvgSize: null,
    growthDifference: null,
    growthSpeed: null,
  });
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all historical analyses for all zones
      // Use the time filter's days to limit server-side data fetching
      const filterConfig = TIME_FILTERS[timeFilter];
      const allZonesData = {};
      const allPromises = ZONES.map(async (zoneId) => {
        try {
          const response = await getAllImageAnalysesForZone(zoneId, filterConfig.days);
          return { zoneId, data: response.data?.analyses || [] };
        } catch (err) {
          console.warn(`Failed to fetch data for ${zoneId}:`, err);
          return { zoneId, data: [] };
        }
      });

      const results = await Promise.all(allPromises);
      results.forEach(({ zoneId, data }) => {
        allZonesData[zoneId] = data;
        console.log(`📥 Fetched ${zoneId}: ${data.length} records`);
      });

      // Process and aggregate data based on time filter
      // Note: Server already filtered by date, but we still need cutoffDate for client-side grouping
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filterConfig.days);
      console.log(`📅 Date filter: ${filterConfig.label} (${filterConfig.days} days), cutoff: ${cutoffDate.toISOString().split('T')[0]}`);

      const processedData = processTimeSeriesData(allZonesData, filterConfig, cutoffDate);
      console.log(`📊 Processed chart data: ${processedData.chartData.length} data points`);
      console.log(`📊 Sample data point:`, processedData.chartData[0] || 'No data');
      setChartData(processedData.chartData);
      setSummaryMetrics(processedData.summary);
    } catch (err) {
      console.error('Error loading growth status data:', err);
      setError('Unable to load growth status data');
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (allZonesData, filterConfig, cutoffDate) => {
    // Group data by time period
    const grouped = {};
    const allMetrics = { average_fruit_size: [], growth_speed: [] };

    ZONES.forEach((zoneId, zoneIndex) => {
      const zoneData = allZonesData[zoneId] || [];
      
      zoneData.forEach((analysis) => {
        if (!analysis.growth_metrics) return;
        
        const timestamp = new Date(analysis.timestamp || analysis.created_at);
        if (timestamp < cutoffDate) return;

        const timeKey = getTimeKey(timestamp, filterConfig.groupBy);
        if (!grouped[timeKey]) {
          grouped[timeKey] = { date: timeKey, timestamp };
        }

        const size = analysis.growth_metrics.average_fruit_size;
        const speed = analysis.growth_metrics.growth_speed;
        const count = analysis.growth_metrics.fruit_count;
        const blossom = analysis.growth_metrics.blossom_area_coverage;
        const stage = analysis.growth_metrics.stage || 'unknown';

        // Store all metrics
        const metrics = {
          average_fruit_size: size,
          growth_speed: speed,
          fruit_count: count,
          blossom_area_coverage: blossom,
        };

        // Include ALL values (including zeros) to show complete lifecycle
        // Zero values are meaningful - they represent dormancy/off-season periods
        // Only skip if value is invalid (not a number)
        Object.entries(metrics).forEach(([metricKey, value]) => {
          if (typeof value === 'number' && !isNaN(value)) {
            if (!grouped[timeKey][zoneId]) {
              grouped[timeKey][zoneId] = { 
                average_fruit_size: [], 
                growth_speed: [], 
                fruit_count: [],
                blossom_area_coverage: [],
              };
            }
            grouped[timeKey][zoneId][metricKey].push(value);
            
            // Only add non-zero to metrics for summary calculations
            if (value > 0) {
              if (!allMetrics[metricKey]) {
                allMetrics[metricKey] = [];
              }
              allMetrics[metricKey].push(value);
            }
          }
        });
      });
    });

    // Convert to chart format and calculate averages
    // Ensure all zones are always included in the result, even if they have no data
    const chartData = Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((entry) => {
        const formattedLabel = formatTimeLabel(entry.date, filterConfig.groupBy);
        const result = { 
          date: typeof formattedLabel === 'object' ? formattedLabel.monthName : formattedLabel,
          monthData: typeof formattedLabel === 'object' ? formattedLabel : null,
          timestamp: entry.timestamp,
          rawDate: entry.date,
        };
        
        // Always include all zones in the result (set to null if no data)
        ZONES.forEach((zoneId) => {
          if (entry[zoneId] && entry[zoneId][selectedMetric] && entry[zoneId][selectedMetric].length > 0) {
            const values = entry[zoneId][selectedMetric];
            result[zoneId] = values.reduce((sum, v) => sum + v, 0) / values.length;
          } else {
            result[zoneId] = null;
          }
        });
        
        return result;
      });

    // Calculate summary metrics based on selected metric
    const metricValues = allMetrics[selectedMetric] ? allMetrics[selectedMetric].filter(v => typeof v === 'number') : [];
    
    const currentValue = metricValues.length > 0 
      ? metricValues.reduce((sum, v) => sum + v, 0) / metricValues.length 
      : null;

    // For growth speed, use it directly; for others, calculate a different summary
    const summaryValue = selectedMetric === 'growth_speed' 
      ? currentValue 
      : null;

    return {
      chartData,
      summary: {
        currentAvgSize: currentValue,
        growthDifference: null,
        growthSpeed: summaryValue,
      },
    };
  };

  const getTimeKey = (date, groupBy) => {
    const d = new Date(date);
    if (groupBy === 'month') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (groupBy === 'week') {
      // Get week number (ISO week)
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
      const weekNum = Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7);
      return `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    } else {
      // Daily grouping
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  };

  const formatTimeLabel = (timeKey, groupBy) => {
    // All views now use daily grouping, format based on how much data we're showing
    const [year, month, day] = timeKey.split('-');
    const currentYear = new Date().getFullYear();
    const labelYear = parseInt(year);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // For daily view (30 days), show date
    if (groupBy === 'day' && timeFilter === 'day') {
      return `${monthNames[parseInt(month) - 1]} ${day}`;
    }
    // For weekly view (90 days), show date
    else if (groupBy === 'day' && timeFilter === 'weekly') {
      return `${monthNames[parseInt(month) - 1]} ${day}`;
    }
    // For monthly view (365 days), return full date but we'll filter in the chart to show only month labels
    else {
      // Return the date with month-year for internal use
      return { month: parseInt(month), year: labelYear, day: parseInt(day), monthName: monthNames[parseInt(month) - 1] };
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [timeFilter, selectedMetric]);

  const currentMetricInfo = METRIC_OPTIONS.find(m => m.value === selectedMetric);

  // Helper function to get monthly tick labels for the X-axis
  const getMonthlyTicks = (data) => {
    if (!data || data.length === 0) return [];
    
    // If we're in monthly view, extract unique months
    if (timeFilter === 'month') {
      const monthsMap = new Map();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      data.forEach(item => {
        if (item.monthData) {
          const key = `${item.monthData.year}-${item.monthData.month}`;
          if (!monthsMap.has(key)) {
            monthsMap.set(key, item.monthData.monthName);
          }
        }
      });
      
      return Array.from(monthsMap.values());
    }
    
    return undefined;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.98)',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 200,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                    boxShadow: `0 0 4px ${entry.color}`,
                  }}
                />
                <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
                  {entry.name}:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  {entry.value.toFixed(selectedMetric === 'fruit_count' ? 0 : selectedMetric === 'average_fruit_size' ? 0 : 1)} {currentMetricInfo?.unit || ''}
                </Typography>
              </Box>
            )
          ))}
        </Box>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2, flexWrap: 'wrap' }}>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 3,
                borderRadius: 1,
                bgcolor: entry.color,
                boxShadow: `0 2px 8px ${entry.color}40`,
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', ...cardProps.sx }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={180}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading plant growth status...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ height: '100%', ...cardProps.sx }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimelineIcon color="primary" fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Plant Growth Status
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={selectedMetric}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedMetric(value);
                    updateUserSettings({ defaultGrowthMetric: value });
                  }}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {METRIC_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
                See details
              </Button>
            </Box>
          </Box>

          {error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <>
              {/* Time Filter Buttons */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <ButtonGroup size="small" sx={{ 
                  '& .MuiButton-root': {
                    px: 2.5,
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 500,
                  },
                  '& .MuiButton-contained': {
                    boxShadow: 'none',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    },
                  },
                }}>
                  {Object.entries(TIME_FILTERS).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={timeFilter === key ? 'contained' : 'outlined'}
                      onClick={() => {
                        setTimeFilter(key);
                        updateUserSettings({ defaultGrowthTimeFilter: key });
                      }}
                    >
                      {config.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              {/* Summary Metrics */}
              {selectedMetric === 'growth_speed' && summaryMetrics.growthSpeed !== null && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2.5,
                    py: 1.5,
                    mb: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(76, 175, 80, 0.08) 100%)',
                    border: '1px solid',
                    borderColor: 'rgba(33, 150, 243, 0.2)',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Average Growth Speed:
                  </Typography>
                  <Chip
                    label={`+${summaryMetrics.growthSpeed.toFixed(1)}% per day`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      color: '#388E3C',
                      fontWeight: 600,
                      fontSize: '0.813rem',
                    }}
                  />
                </Box>
              )}

              {/* Chart */}
              <Box sx={{ width: '100%', height: 260, position: 'relative' }}>
                {chartData.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No growth data available for the selected time period. Data will appear when CV team uploads analyses.
                  </Alert>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <defs>
                        {ZONES.map((zoneId) => (
                          <linearGradient key={`gradient-${zoneId}`} id={`gradient-${zoneId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ZONE_COLORS[zoneId].gradient[0]} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={ZONE_COLORS[zoneId].gradient[1]} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="rgba(0, 0, 0, 0.06)" 
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickLine={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
                        axisLine={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
                        height={50}
                        ticks={timeFilter === 'month' ? getMonthlyTicks(chartData) : undefined}
                        interval={timeFilter === 'month' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickLine={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
                        axisLine={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
                        label={{ 
                          value: `${currentMetricInfo?.label} (${currentMetricInfo?.unit})`, 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: 12, fill: '#666' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      {ZONES.map((zoneId, index) => {
                        const hasData = chartData.some(d => d[zoneId] !== null && d[zoneId] !== undefined);
                        return (
                          <Line
                            key={zoneId}
                            type="monotoneX"
                            dataKey={zoneId}
                            stroke={ZONE_COLORS[zoneId].stroke}
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{
                              r: 5,
                              fill: ZONE_COLORS[zoneId].stroke,
                              stroke: '#fff',
                              strokeWidth: 2,
                              style: { cursor: 'pointer' },
                            }}
                            connectNulls={true}
                            name={zoneId.replace('PV_Zone_', 'Zone ')}
                            animationDuration={1000}
                            animationEasing="ease-in-out"
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Growth Data Details</DialogTitle>
        <DialogContent>
          {selectedDataPoint ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {selectedDataPoint.data.date}
              </Typography>
              {ZONES.map((zoneId, index) => {
                const value = selectedDataPoint.data[zoneId];
                if (value === null || value === undefined) return null;
                return (
                  <Box key={zoneId} sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          width: 12,
                          height: 12,
                          bgcolor: ZONE_COLORS[zoneId]?.stroke,
                          borderRadius: '50%',
                          mr: 1,
                        }}
                      />
                      {zoneId.replace('PV_Zone_', 'Zone ')}: {value.toFixed(selectedMetric === 'fruit_count' ? 0 : selectedMetric === 'average_fruit_size' ? 0 : 1)}
                      {selectedMetric === 'average_fruit_size' ? ' px' : selectedMetric === 'growth_speed' ? '%' : selectedMetric === 'blossom_area_coverage' ? '%' : ' fruits'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Click on a data point in the chart to see details.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlantGrowthStatusChart;

