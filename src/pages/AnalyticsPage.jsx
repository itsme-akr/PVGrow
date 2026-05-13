/** @jsxImportSource @emotion/react */
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import Footer from '../components/Footer';
import SensorHistoryChart from '../components/charts/SensorHistoryChart';
import AnomalyTimelineChart from '../components/charts/AnomalyTimelineChart';
import WeatherHistoryChart from '../components/charts/WeatherHistoryChart';
import HarvestPredictionSystem from '../components/charts/PlantGrowthChart';
import AlertsHistorySection from '../components/alerts/AlertsHistorySection';

const AnalyticsPage = () => {
  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Historic Data & Analytics
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {/* Sensor Historical Data and Weather Forecast - Side by Side with equal width */}
        <Box sx={{ flex: 1 }}>
          <SensorHistoryChart />
        </Box>
        <Box sx={{ flex: 1 }}>
          <WeatherHistoryChart />
        </Box>
      </Box>

      <Grid container spacing={2}>

        {/* Anomaly Timeline - Full Width */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <AnomalyTimelineChart />
          </Box>
        </Grid>

        {/* Harvest Prediction System */}
        <Grid item xs={12}>
          <HarvestPredictionSystem />
        </Grid>

        {/* Alerts History */}
        <Grid item xs={12}>
          <AlertsHistorySection />
        </Grid>
      </Grid>
      
      <Footer />
    </Box>
  );
};

export default AnalyticsPage;

