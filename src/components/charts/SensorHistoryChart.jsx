/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllZonesHistoricalReadings } from '../../services/api.js';
import { convertSensorValues } from '../../utils/sensorConversion.js';
import { formatDate, formatTimestamp } from '../../utils/dateFormat.js';

const SensorHistoryChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('air_temperature');
  const [days, setDays] = useState(180); // Default: 6 months

  const metrics = [
    { value: 'air_temperature', label: 'Air Temperature (°C)', color: '#ff6b6b' },
    { value: 'soil_temperature', label: 'Soil Temperature (°C)', color: '#4ecdc4' },
    { value: 'irradiance', label: 'Irradiance (kW/m²)', color: '#ffe66d' },
    { value: 'soil_moisture', label: 'Soil Moisture (%)', color: '#95e1d3' }
  ];

  const zoneColors = {
    'PV_Zone_1': '#8884d8',
    'PV_Zone_2': '#82ca9d',
    'PV_Zone_3': '#ffc658',
    'PV_Zone_4': '#ff8042'
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAllZonesHistoricalReadings(days);
      
      console.log('Historical data response:', response.data);
      
      if (response.data && Object.keys(response.data).length > 0) {
        // Transform data for recharts
        const transformedData = transformDataForChart(response.data);
        console.log('Transformed data:', transformedData.slice(0, 5)); // Log first 5 entries
        setData(transformedData);
      } else {
        console.log('No historical data received');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const transformDataForChart = (zonesData) => {
    // Create a map of timestamps to readings
    const timeMap = {};
    
    Object.keys(zonesData).forEach(zone => {
      zonesData[zone].forEach(reading => {
        const timestamp = new Date(reading.timestamp).getTime();
        if (!timeMap[timestamp]) {
          timeMap[timestamp] = { timestamp };
        }
        
        // Convert sensor values
        const converted = convertSensorValues(reading);
        timeMap[timestamp][`${zone}_air_temperature`] = converted.air_temperature;
        timeMap[timestamp][`${zone}_soil_temperature`] = converted.soil_temperature;
        timeMap[timestamp][`${zone}_irradiance`] = converted.irradiance;
        timeMap[timestamp][`${zone}_soil_moisture`] = converted.soil_moisture;
      });
    });
    
    // Convert to array and sort by timestamp
    return Object.values(timeMap).sort((a, b) => a.timestamp - b.timestamp);
  };

  const formatXAxis = (timestamp) => {
    if (days <= 1) {
      // For 24H: show YYYY-MM-DD HH:MM
      const ts = formatTimestamp(timestamp);
      const parts = ts.split(' ');
      return parts.length > 1 ? `${parts[0]} ${parts[1].substring(0, 5)}` : parts[0];
    } else if (days <= 7) {
      // For 7D: show YYYY-MM-DD
      return formatDate(timestamp);
    } else if (days <= 30) {
      // For 30D: show YYYY-MM-DD
      return formatDate(timestamp);
    } else {
      // For 6 months: show YYYY-MM (extract from YYYY-MM-DD)
      const dateStr = formatDate(timestamp);
      return dateStr.substring(0, 7); // YYYY-MM
    }
  };

  const currentMetric = metrics.find(m => m.value === metric);

  return (
    <Card sx={{ width: '100%', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Sensor Historical Data
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Metric</InputLabel>
              <Select value={metric} onChange={(e) => setMetric(e.target.value)} label="Metric">
                {metrics.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={days}
              exclusive
              onChange={(e, newValue) => newValue && setDays(newValue)}
              size="small"
            >
              <ToggleButton value={1}>24h</ToggleButton>
              <ToggleButton value={7}>7d</ToggleButton>
              <ToggleButton value={30}>30d</ToggleButton>
              <ToggleButton value={180}>6M</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No historical data available
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                stroke="#666"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '0.75rem' }}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                labelFormatter={(value) => formatTimestamp(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }}
                formatter={(value) => value?.toFixed(2) || 'N/A'}
              />
              <Legend 
                wrapperStyle={{ fontSize: '0.85rem' }}
                formatter={(value) => value.replace(`_${metric}`, '').replace('PV_Zone_', 'Zone ')}
              />
              {Object.keys(zoneColors).map(zone => (
                <Line
                  key={zone}
                  type="monotone"
                  dataKey={`${zone}_${metric}`}
                  stroke={zoneColors[zone]}
                  strokeWidth={3}
                  dot={false}
                  name={zone}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SensorHistoryChart;

