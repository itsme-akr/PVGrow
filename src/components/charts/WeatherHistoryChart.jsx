/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWeatherForecast } from '../../services/api.js';
import { formatDate, formatTimestamp } from '../../utils/dateFormat.js';

const WeatherHistoryChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(48);

  useEffect(() => {
    fetchData();
  }, [hours]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getWeatherForecast(hours);
      
      if (response.data && Array.isArray(response.data)) {
        const chartData = response.data.map(item => ({
          timestamp: new Date(item.forecast_time).getTime(),
          temperature: item.temperature,
          precipitation: item.precipitation || 0,
          humidity: item.humidity,
          windSpeed: item.wind_speed
        }));
        setData(chartData);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp) => {
    if (hours <= 24) {
      // For 24H: show YYYY-MM-DD HH:MM
      const ts = formatTimestamp(timestamp);
      const parts = ts.split(' ');
      return parts.length > 1 ? `${parts[0]} ${parts[1].substring(0, 5)}` : parts[0];
    } else {
      // For 48H and 7D: show YYYY-MM-DD HH:MM
      const ts = formatTimestamp(timestamp);
      const parts = ts.split(' ');
      return parts.length > 1 ? `${parts[0]} ${parts[1].substring(0, 5)}` : parts[0];
    }
  };

  return (
    <Card sx={{ width: '100%', height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Weather Forecast
          </Typography>
          <ToggleButtonGroup
            value={hours}
            exclusive
            onChange={(e, newValue) => newValue && setHours(newValue)}
            size="small"
          >
            <ToggleButton value={24}>24h</ToggleButton>
            <ToggleButton value={48}>48h</ToggleButton>
            <ToggleButton value={168}>7d</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No weather forecast data available
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                stroke="#666"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis yAxisId="left" stroke="#666" style={{ fontSize: '0.75rem' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#666" style={{ fontSize: '0.75rem' }} />
              <Tooltip 
                labelFormatter={(value) => formatTimestamp(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
              <Bar yAxisId="right" dataKey="precipitation" fill="#4fc3f7" name="Precipitation (mm)" />
              <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff6b6b" strokeWidth={2} dot={false} name="Temperature (°C)" />
              <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#95e1d3" strokeWidth={2} dot={false} name="Humidity (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherHistoryChart;

