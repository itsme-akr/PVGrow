/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { getLatestReadingForZone } from '../services/api';
import { convertSensorValues, formatSensorValue } from '../utils/sensorConversion';
import { formatTimestamp } from '../utils/dateFormat.js';

/**
 * Compact sensor summary for a single zone.
 * Used on the Alerts page under the zone selector so that
 * the sensor values correspond to the currently selected zone.
 */
const ZoneSensorSummary = ({ zoneId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!zoneId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getLatestReadingForZone(zoneId);
        // Convert raw sensor values to real-world values
        let convertedData = convertSensorValues(response.data);

        // Apply same demo overrides as DashboardPage
        if (zoneId === 'PV_Zone_1') {
          try {
            const zone2Response = await getLatestReadingForZone('PV_Zone_2');
            const zone2Data = convertSensorValues(zone2Response.data);
            if (typeof zone2Data.air_temperature === 'number') {
              convertedData.air_temperature = Number((zone2Data.air_temperature + 0.91).toFixed(1));
            }
          } catch (refErr) {
            console.warn('Unable to fetch Zone 2 reference temperature for override:', refErr);
          }
        }
        // Zone 4: No override - show exact database value (second-to-last row from backend)

        setData({
          air_temperature:
            convertedData?.air_temperature !== undefined
              ? `${formatSensorValue(convertedData.air_temperature, 'temperature')}°C`
              : 'N/A',
          soil_temperature:
            convertedData?.soil_temperature !== undefined
              ? `${formatSensorValue(convertedData.soil_temperature, 'temperature')}°C`
              : 'N/A',
          irradiance:
            convertedData?.irradiance !== undefined
              ? `${formatSensorValue(convertedData.irradiance, 'irradiance')} kW/m²`
              : 'N/A',
          soil_moisture:
            convertedData?.soil_moisture !== undefined
              ? `${formatSensorValue(convertedData.soil_moisture, 'moisture')}%`
              : 'N/A',
          timestamp: response.data?.timestamp || response.data?.created_at || null,
        });
      } catch (err) {
        console.error('Error fetching zone sensor data:', err);
        setError('Unable to load sensor data for this zone.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds to match Dashboard
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [zoneId]);

  if (loading) {
    return (
      <Card sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
        <CircularProgress size={24} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          {error || 'No sensor data available for this zone.'}
        </Typography>
      </Card>
    );
  }

  const formattedZone = zoneId.replace('PV_Zone_', 'Zone ');

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {formattedZone} – Sensor Details
          </Typography>
          {data.timestamp && (
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(data.timestamp)}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Air Temperature
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {data.air_temperature}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Soil Temperature
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {data.soil_temperature}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Irradiance
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {data.irradiance}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Soil Moisture
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {data.soil_moisture}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ZoneSensorSummary;


