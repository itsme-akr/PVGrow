import React, { useState } from 'react';

import PlantGrowthStatusChart from '../components/charts/PlantGrowthStatusChart';
import AnomalyImageViewer from '../components/AnomalyImageViewer';

import {
  Box,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';

import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

import ThermostatRoundedIcon from '@mui/icons-material/ThermostatRounded';
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DeviceThermostatRoundedIcon from '@mui/icons-material/DeviceThermostatRounded';

import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import GrowthStageBanner from '../components/GrowthStageBanner';
import ZoneSelector from '../components/ZoneSelector';
import SensorWidget from '../components/SensorWidget';

import WeatherWidget from '../components/WeatherWidget';
import WeatherImpactAssessment from '../components/WeatherImpactAssessment';

import RecommendationsPanel from '../components/RecommendationsPanel';
import AlertsPanel from '../components/AlertsPanel';

import DiseaseMonitoringPanel from '../components/DiseaseMonitoringPanel';

import MultiZoneComparison from '../components/MultiZoneComparison';

import GrowthAndFruitMetricsCard from '../components/GrowthAndFruitMetricsCard';
import GrowthMetricsCard from '../components/GrowthMetricsCard';

const DashboardPage = () => {
  const [selectedZone, setSelectedZone] =
    useState('PV_Zone_1');

  return (
    <Box sx={{ pb: 6, 
     
    }}
    >
      {/* PAGE HEADER */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            letterSpacing: '-0.03em',
          }}
        >
          Smart Farm Dashboard
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
        >
          Operational monitoring, analytics
          and intelligent agricultural
          insights.
        </Typography>
      </Box>

      {/* ========================= */}
      {/* ROW 1 */}
      {/* ========================= */}

      <Grid
        container
        spacing={2.2}
        sx={{ mb: 2.5 }}
      >
      

        {/* PLANT INTELLIGENCE HUB */}
        <Grid size={{ xs: 12 }}>
          <Card
            sx={{
              height: '100%',
              width: '100%',

              borderRadius: '30px',

              overflow: 'hidden',

              background:
'linear-gradient(180deg,rgba(255,255,255,0.96) 0%,rgba(240,253,244,0.72) 100%)',

              border:
                '1px solid rgba(15,23,42,0.06)',
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 1.8,
                  md: 2.2,
                },
              }}
            >
              <Grid container spacing={2.2}>
                {/* LEFT SIDE */}
                <Grid
                  size={{ xs: 12, lg: 8.5 }}
                  sx={{ display: 'flex' }}
                >
                  <GrowthStageBanner />
                </Grid>

                {/* RIGHT SIDE */}
                <Grid
                  size={{ xs: 12, lg: 3.5 }}
                  sx={{ display: 'flex' }}
                >
                  <Stack
                    spacing={2}
                    sx={{ height: '100%',
                    width: '100%', }}
                  >
                    {/* SYSTEM STATUS */}
                    <Paper
                      sx={{
                        p: 2,

                        borderRadius: '22px',

                        border:
                          '1px solid rgba(15,23,42,0.06)',

                        background:
                          'rgba(255,255,255,0.78)',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1.6 }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700 }}
                        >
                          System Status
                        </Typography>

                        <Chip
                          label="Offline"
                          color="error"
                          size="small"
                        />
                      </Stack>

                      <Grid container spacing={1.5}>
                        <Grid size={4}>
                          <StatusMiniCard
                            icon={<SensorsRoundedIcon />}
                            label="Sensors"
                          />
                        </Grid>

                        <Grid size={4}>
                          <StatusMiniCard
                            icon={<CloudRoundedIcon />}
                            label="Weather"
                          />
                        </Grid>

                        <Grid size={4}>
                          <StatusMiniCard
                            icon={<TrendingUpRoundedIcon />}
                            label="AI"
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* AI FIELD MONITORING */}
                    <Paper
                      sx={{
                        flex: 1,

                        p: 2,

                        borderRadius: '22px',

                        border:
                          '1px solid rgba(15,23,42,0.06)',

                        background:
                          'rgba(248,250,252,0.9)',
                      }}
                    >
                      <AnomalyImageViewer
                        selectedZone={selectedZone}
                        compact
                      />
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ========================= */}
      {/* ROW 2 */}
      {/* ========================= */}

      <Grid
        container
        spacing={2.2}
        sx={{ mb: 2.5 }}
      >
        {/* LIVE OPERATIONS */}
        <Grid
  size={{ xs: 12, lg: 7.5 }}
  sx={{ display: 'flex' }}
>
          <Card
            sx={{
              height: '100%',
              width: '100%',

              overflow: 'hidden',

              borderRadius: '28px',

              background:
'linear-gradient(180deg,#ffffff 0%,rgba(239,246,255,0.82) 100%)',

              border:
                '1px solid rgba(15,23,42,0.06)',
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 1.8,
                  md: 2.2,
                },
              }}
            >
              {/* HEADER */}
              <Stack
                direction={{
                  xs: 'column',
                  lg: 'row',
                }}
                justifyContent="space-between"
                spacing={2}
                sx={{
                  mb: 3,
                }}
              >
                {/* LEFT */}
                <Box>
                  <Stack
                    direction="row"
                    spacing={1.2}
                    alignItems="center"
                    flexWrap="wrap"
                    
                    sx={{ mb: 1 }}
                  >
                    <SensorsRoundedIcon color="primary" />

                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Live Operations Center
                    </Typography>

                    <Chip
                      label="Offline"
                      color="error"
                      size="small"
                      sx={{
                        fontWeight: 700,
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Real-time environmental
                    monitoring, sensor
                    intelligence and
                    operational controls.
                  </Typography>
                </Box>

                {/* RIGHT */}
                <Stack
                  direction="row"
                  spacing={1.2}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{
                        rowGap: 1.2,
                      }}
                >
                  <ZoneSelector
                    currentZone={
                      selectedZone
                    }
                    onZoneSelect={
                      setSelectedZone
                    }
                  />

                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    {/* REFRESH */}
                    <Box
                      sx={{
                        
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 1,

                        px: 1.6,
                        py: 1,

                        borderRadius:
                          '14px',

                        backgroundColor:
                          '#ffffff',

                        border:
                          '1px solid rgba(15,23,42,0.08)',

                        cursor: 'pointer',

                        transition:
                          'all 0.2s ease',

                        '&:hover': {
                          transform:
                            'translateY(-2px)',

                          boxShadow:
                            '0 10px 20px rgba(15,23,42,0.08)',
                        },
                      }}
                    >
                      <RefreshRoundedIcon
                        sx={{
                          fontSize:
                            '1rem',
                          color:
                            '#475569',
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        Refresh
                      </Typography>
                    </Box>

                    {/* SYNC */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 1,

                        px: 1.6,
                        py: 1,

                        borderRadius:
                          '14px',

                        background:
                          'linear-gradient(135deg,#eff6ff 0%,#ffffff 100%)',

                        border:
                          '1px solid rgba(37,99,235,0.12)',

                        cursor: 'pointer',

                        transition:
                          'all 0.2s ease',

                        '&:hover': {
                          transform:
                            'translateY(-2px)',

                          boxShadow:
                            '0 10px 20px rgba(37,99,235,0.12)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,

                          borderRadius:
                            '50%',

                          backgroundColor:
                            '#3b82f6',

                          boxShadow:
                            '0 0 10px rgba(59,130,246,0.8)',
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color:
                            '#1d4ed8',
                        }}
                      >
                        Sync Live
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Stack>

              {/* SENSOR GRID */}
              <Grid
                container
                spacing={2.2}
                alignItems="stretch"
              >
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <SensorWidget
                    icon={
                      <ThermostatRoundedIcon />
                    }
                    label="Temperature"
                    value="ERR"
                    unit="°C"
                    type="temperature"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <SensorWidget
                    icon={
                      <DeviceThermostatRoundedIcon />
                    }
                    label="Soil Temperature"
                    value="ERR"
                    unit="°C"
                    type="soilTemp"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <SensorWidget
                    icon={
                      <WbSunnyRoundedIcon />
                    }
                    label="Irradiance"
                    value="ERR"
                    unit="kW/m²"
                    type="irradiance"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <SensorWidget
                    icon={
                      <WaterDropRoundedIcon />
                    }
                    label="Soil Moisture"
                    value="ERR"
                    unit="%"
                    type="moisture"
                  />
                </Grid>
              </Grid>

              {/* FOOTER */}
              <Stack
                direction={{
                  xs: 'column',
                  md: 'row',
                }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  mt: 3,
                  pt: 2.5,

                  borderTop:
                    '1px solid rgba(15,23,42,0.06)',
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Last synchronization
                  attempt: 2 mins ago
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,

                      borderRadius:
                        '50%',

                      backgroundColor:
                        '#ef4444',
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#ef4444',
                    }}
                  >
                    Sensor network
                    unavailable
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{ xs: 12, lg: 4 }}
          sx={{ display: 'flex' }}
        >
          <Stack
            spacing={2}
            sx={{ height: '100%', width:'100%' }}
          >
            {/* ALERTS */}
            <Box
              sx={{
                flex: '0 0 auto',
              }}
            >
              <AlertsPanel />
            </Box>

            {/* PLANT STATUS */}
            <Paper
              sx={{
                flex: 1,

                p: 2,

                borderRadius: '24px',

                border:
                  '1px solid rgba(15,23,42,0.06)',

                background:
                  'rgba(255,255,255,0.82)',

                display: 'flex',

                flexDirection: 'column',
              }}
            >
              <PlantGrowthStatusChart compact />
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* ========================= */}
      {/* ROW 3 */}
      {/* ========================= */}

      <Grid
        container
        spacing={2.2}
        sx={{ mb: 2.5 }}
      >
        {/* CLIMATE INTELLIGENCE */}
        <Grid size={{ xs: 12, lg: 6 }}>
  <Box
    sx={{
      '& .MuiCard-root': {
        background:
          'linear-gradient(180deg,#ffffff 0%,rgba(239,246,255,0.68) 100%)',
      },
    }}
  >
    <WeatherWidget />
  </Box>
</Grid>

        {/* AI RECOMMENDATIONS */}
        <Grid size={{ xs: 12, lg: 6 }}>
  <Box
    sx={{
      '& .MuiCard-root': {
        background:
          'linear-gradient(180deg,#ffffff 0%,rgba(245,243,255,0.72) 100%)',
      },
    }}
  >
    <RecommendationsPanel />
  </Box>
</Grid>
      </Grid>

      {/* ========================= */}
      {/* ROW 4 */}
      {/* ========================= */}

      <Grid
        container
        spacing={2.2}
        sx={{ mb: 2.5 }}
      >
        {/* CLIMATE RISK */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box
            sx={{
              background: 'rgba(255,247,237,0.82)',
              borderRadius: '24px',
              p: 0.6,
              height: '100%',
            }}
          >
            <WeatherImpactAssessment />
          </Box>
        </Grid>

        {/* SYSTEM DETECTIONS */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box
            sx={{
              background: 'rgba(248,250,252,0.92)',
              borderRadius: '24px',
              p: 0.6,
              height: '100%',
            }}
          >
            <DiseaseMonitoringPanel />
          </Box>
        </Grid>
      </Grid>

      {/* ========================= */}
      {/* ROW 5 */}
      {/* ========================= */}

      <Grid container spacing={2.2}>
        {/* MULTI-ZONE */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <MultiZoneComparison />
        </Grid>

        {/* RIGHT STACK */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <Stack spacing={2.2}>
            {/* GROWTH + HARVEST */}
            <GrowthAndFruitMetricsCard />

            {/* PLATFORM SUMMARY */}
            <Card
              sx={{
                borderRadius: '24px',

                height: 'fit-content',

                background:
                  'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',

                border:
                  '1px solid rgba(15,23,42,0.06)',

                overflow: 'hidden',
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  '&:last-child': {
                    pb: 2,
                  },
                }}
              >
                {/* HEADER */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  Platform Summary
                </Typography>

                {/* METRICS */}
                <Box
  sx={{
    display: 'grid',

    gridTemplateColumns:
      'repeat(2, minmax(0,1fr))',

    gap: 1.5,
  }}
>
  <CompactSummaryMetric
    label="Active Zones"
    value="4"
  />

  <CompactSummaryMetric
    label="Alerts"
    value="0"
  />

  <CompactSummaryMetric
    label="Recommendations"
    value="0"
  />

  <Box
    sx={{
      p: 1.2,

      borderRadius: '16px',

      background:
        'rgba(22,163,74,0.08)',

      border:
        '1px solid rgba(22,163,74,0.12)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: '#64748b',
      }}
    >
      System Health
    </Typography>

    <Typography
      sx={{
        fontWeight: 800,

        color: '#15803d',

        mt: 0.4,
      }}
    >
      Stable
    </Typography>
  </Box>
</Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

const SummaryMetric = ({
  label,
  value,
}) => (
  <Box>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        mb: 0.7,
      }}
    >
      {label}
    </Typography>

    <Typography
      variant="h4"
      sx={{
        fontWeight: 800,
      }}
    >
      {value}
    </Typography>
  </Box>
);

const StatusItem = ({
  icon,
  text,
}) => (
  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
  >
    {icon}

    <Typography
      variant="body2"
      color="text.secondary"
    >
      {text}
    </Typography>
  </Stack>
);

const StatusMiniCard = ({
  icon,
  label,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.3,

      borderRadius: '16px',

      textAlign: 'center',

      background:
        'rgba(248,250,252,0.95)',

      border:
        '1px solid rgba(15,23,42,0.05)',

      transition: 'all 0.2s ease',

      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow:
          '0 10px 20px rgba(15,23,42,0.06)',
      },
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 0.5,
        color: '#2563eb',
      }}
    >
      {icon}
    </Box>

    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
      }}
    >
      {label}
    </Typography>
  </Paper>
);

const CompactSummaryMetric = ({
  label,
  value,
}) => (
  <Box
    sx={{
      p: 1.2,

      borderRadius: '16px',

      background:
        'rgba(248,250,252,0.9)',

      border:
        '1px solid rgba(15,23,42,0.06)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        color: '#64748b',
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontWeight: 800,

        mt: 0.4,

        color: '#0f172a',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default DashboardPage;