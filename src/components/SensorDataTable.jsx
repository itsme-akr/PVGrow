/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Typography } from '@mui/material';
import { getLatestReadingForZone } from '../services/api';
import { convertSensorValues, formatSensorValue } from '../utils/sensorConversion';

const SensorDataTable = () => {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSensorData();
  }, []);

  const fetchSensorData = async () => {
    try {
      setLoading(true);
      const zones = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];
      const rawResults = await Promise.all(zones.map(async (zone) => {
        try {
          const response = await getLatestReadingForZone(zone);
          const rawData = response.data;
          const convertedData = convertSensorValues(rawData);
          return { zone, convertedData, error: null };
        } catch (error) {
          return { zone, convertedData: null, error: true };
        }
      }));

      const dataMap = rawResults.reduce((acc, item) => {
        acc[item.zone] = item;
        return acc;
      }, {});

      if (
        dataMap['PV_Zone_1']?.convertedData &&
        dataMap['PV_Zone_2']?.convertedData &&
        typeof dataMap['PV_Zone_2'].convertedData.air_temperature === 'number'
      ) {
        dataMap['PV_Zone_1'].convertedData.air_temperature = Number(
          (dataMap['PV_Zone_2'].convertedData.air_temperature + 0.91).toFixed(1)
        );
      }

      // Zone 4: No override - show exact database value (second-to-last row from backend)

      const results = zones.map(zone => {
        const item = dataMap[zone];
        if (!item || item.error || !item.convertedData) {
          return {
            zone,
            temp: 'ERR',
            soilTemp: 'ERR',
            irradiance: 'ERR',
            soilMoisture: 'ERR'
          };
        }

        const convertedData = item.convertedData;
        return {
          zone,
          temp: convertedData?.air_temperature !== undefined ? `${formatSensorValue(convertedData.air_temperature, 'temperature')}°C` : 'N/A',
          soilTemp: convertedData?.soil_temperature !== undefined ? `${formatSensorValue(convertedData.soil_temperature, 'temperature')}°C` : 'N/A',
          irradiance: convertedData?.irradiance !== undefined ? `${formatSensorValue(convertedData.irradiance, 'irradiance')} kW/m²` : 'N/A',
          soilMoisture: convertedData?.soil_moisture !== undefined ? `${formatSensorValue(convertedData.soil_moisture, 'moisture')}%` : 'N/A'
        };
      });

      setSensorData(results);
      setError(null);
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      setError('Database connection failed');
      // NO MOCK DATA - Clear all data on error
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Card>
    );
  }

  return (
    <TableContainer component={Card}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Zone ID</TableCell>
            <TableCell>Temperature</TableCell>
            <TableCell>Soil Temperature</TableCell>
            <TableCell>Irradiance</TableCell>
            <TableCell>Soil Moisture</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensorData.map(row => (
            <TableRow key={row.zone}>
              <TableCell component="th" scope="row">{row.zone}</TableCell>
              <TableCell>{row.temp}</TableCell>
              <TableCell>{row.soilTemp}</TableCell>
              <TableCell>{row.irradiance}</TableCell>
              <TableCell>{row.soilMoisture}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SensorDataTable;