/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { getCurrentWeather, getWeatherForecast, triggerWeatherUpdate } from '../services/api.js';
import Footer from '../components/Footer.jsx';
import { 
  getWeatherInfo, 
  formatTemperature, 
  formatHumidity, 
  formatPrecipitation,
  formatWindSpeed,
  formatPressure,
  formatUVIndex,
  formatTime,
  formatDate,
  getAgriculturalAdvice
} from '../utils/weatherUtils.js';

const WeatherPage = () => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch current weather and 7-day forecast in parallel
      const [currentResponse, forecastResponse] = await Promise.all([
        getCurrentWeather(),
        getWeatherForecast(168) // 7 days * 24 hours
      ]);
      
      if (currentResponse.data) {
        setCurrentWeather(currentResponse.data);
      }
      
      if (forecastResponse.data) {
        setForecast(forecastResponse.data);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleWeatherUpdate = async () => {
    try {
      await triggerWeatherUpdate();
      // Wait a moment then refresh the data
      setTimeout(() => {
        fetchWeatherData();
      }, 2000);
    } catch (error) {
      console.error('Failed to trigger weather update:', error);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 600000);
    return () => clearInterval(interval);
  }, []);

  // Group forecast by days for daily cards
  const getDailyForecast = () => {
    if (!forecast.length) return [];
    
    const dailyData = {};
    forecast.forEach(item => {
      const date = new Date(item.forecast_time).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date: item.forecast_time,
          temps: [],
          humidity: [],
          precipitation: [],
          precipitation_prob: [],
          weather_codes: [],
          wind_speeds: [],
          uv_indices: []
        };
      }
      
      if (item.temperature !== null) dailyData[date].temps.push(item.temperature);
      if (item.humidity !== null) dailyData[date].humidity.push(item.humidity);
      if (item.precipitation !== null) dailyData[date].precipitation.push(item.precipitation);
      if (item.precipitation_probability !== null) dailyData[date].precipitation_prob.push(item.precipitation_probability);
      if (item.weather_code !== null) dailyData[date].weather_codes.push(item.weather_code);
      if (item.wind_speed !== null) dailyData[date].wind_speeds.push(item.wind_speed);
      if (item.uv_index !== null) dailyData[date].uv_indices.push(item.uv_index);
    });

    return Object.values(dailyData).slice(0, 7).map(day => ({
      date: day.date,
      minTemp: Math.min(...day.temps),
      maxTemp: Math.max(...day.temps),
      avgHumidity: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
      totalPrecipitation: day.precipitation.reduce((a, b) => a + b, 0),
      maxPrecipitationProb: Math.max(...day.precipitation_prob),
      dominantWeatherCode: day.weather_codes.sort((a,b) => 
        day.weather_codes.filter(v => v === a).length - day.weather_codes.filter(v => v === b).length
      ).pop(),
      avgWindSpeed: day.wind_speeds.reduce((a, b) => a + b, 0) / day.wind_speeds.length,
      maxUVIndex: Math.max(...day.uv_indices)
    }));
  };

  const dailyForecast = getDailyForecast();
  const todayHourly = forecast.filter(item => {
    const itemDate = new Date(item.forecast_time).toDateString();
    const today = new Date().toDateString();
    return itemDate === today;
  }).slice(0, 12); // Next 12 hours

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading weather data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Weather Forecast
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          {error ? (
            <Chip label="Offline" color="error" size="small" />
          ) : (
            <Chip label="Live" color="success" size="small" />
          )}
        </Box>
      </Box>

      {error && (
        <Card sx={{ mb: 3, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', gap: 2, height: '80vh' }}>
        {/* Left Column (35%) - Current Conditions & Agricultural Insights */}
        <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Current Conditions - Top Left */}
          {currentWeather && (
            <Card sx={{ flex: '1 1 50%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Current Conditions
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ fontSize: '3rem', mr: 2 }}>
                    {getWeatherInfo(currentWeather.weather_code).icon}
                  </Box>
                  <Typography variant="h2" sx={{ fontWeight: 'bold', fontSize: '3rem' }}>
                    {formatTemperature(currentWeather.temperature)}
                  </Typography>
                </Box>
                
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {getWeatherInfo(currentWeather.weather_code).description}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Humidity</Typography>
                    <Typography variant="h6">{formatHumidity(currentWeather.humidity)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Wind</Typography>
                    <Typography variant="h6">{formatWindSpeed(currentWeather.wind_speed)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Pressure</Typography>
                    <Typography variant="h6">{formatPressure(currentWeather.pressure)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">UV Index</Typography>
                    <Typography variant="h6">{formatUVIndex(currentWeather.uv_index).text}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Agricultural Insights - Bottom Left */}
          {currentWeather && (
            <Card sx={{ flex: '1 1 50%' }}>
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Agricultural Insights
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Soil Temperature:</strong> {formatTemperature(currentWeather.soil_temperature)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Precipitation:</strong> {formatPrecipitation(currentWeather.precipitation)}
                  </Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Recommendations:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                  {getAgriculturalAdvice(currentWeather).length > 0 ? (
                    getAgriculturalAdvice(currentWeather).map((advice, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        {advice}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ✅ Conditions are favorable for normal farm operations
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right Column (65%) - Today's Hourly Forecast & 7-Day Forecast */}
        <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Today's Hourly Forecast - Top Right (60% height) */}
          {todayHourly.length > 0 && (
            <Card sx={{ flex: '6 1 60%' }}>
              <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Today's Hourly Forecast
                </Typography>
                <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ py: 1 }}>Time</TableCell>
                        <TableCell sx={{ py: 1 }}>Condition</TableCell>
                        <TableCell sx={{ py: 1 }}>Temp</TableCell>
                        <TableCell sx={{ py: 1 }}>Humidity</TableCell>
                        <TableCell sx={{ py: 1 }}>Rain</TableCell>
                        <TableCell sx={{ py: 1 }}>Wind</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {todayHourly.slice(0, 15).map((hour, index) => {
                        const weatherInfo = getWeatherInfo(hour.weather_code);
                        return (
                          <TableRow key={index}>
                            <TableCell sx={{ py: 0.5 }}>{formatTime(hour.forecast_time)}</TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span style={{ fontSize: '1.2rem' }}>{weatherInfo.icon}</span>
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                  {weatherInfo.description}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>{formatTemperature(hour.temperature)}</TableCell>
                            <TableCell sx={{ py: 0.5 }}>{formatHumidity(hour.humidity)}</TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              {formatPrecipitation(hour.precipitation)} 
                              ({Math.round(hour.precipitation_probability)}%)
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>{formatWindSpeed(hour.wind_speed)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* 7-Day Forecast - Bottom Right (40% height) */}
          <Card sx={{ flex: '4 1 40%' }}>
            <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                7-Day Forecast
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', flex: 1, alignItems: 'center' }}>
                {dailyForecast.map((day, index) => {
                  const weatherInfo = getWeatherInfo(day.dominantWeatherCode);
                  const isToday = index === 0;
                  
                  return (
                    <Card 
                      key={index}
                      variant="outlined" 
                      sx={{ 
                        minWidth: 120,
                        textAlign: 'center', 
                        p: 1.5,
                        bgcolor: isToday ? 'primary.lighter' : 'background.paper',
                        flexShrink: 0,
                        height: 'fit-content'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {isToday ? 'Today' : formatDate(day.date)}
                      </Typography>
                      <Box sx={{ fontSize: '2rem', my: 1 }}>
                        {weatherInfo.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatTemperature(day.maxTemp)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTemperature(day.minTemp)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {Math.round(day.maxPrecipitationProb)}% rain
                      </Typography>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default WeatherPage;
