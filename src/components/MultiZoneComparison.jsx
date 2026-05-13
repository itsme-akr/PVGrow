/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useEffect,
} from 'react';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';

import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

const DEMO_ZONES = [
  {
    zone: 'PV_Zone_1',
    temperature: 24,
    soilTemp: 19,
    irradiance: 5.8,
    soilMoisture: 61,
    health: 92,
    status: 'Optimal',
    trend: '+2.1%',
  },

  {
    zone: 'PV_Zone_2',
    temperature: 23,
    soilTemp: 18,
    irradiance: 5.2,
    soilMoisture: 58,
    health: 87,
    status: 'Stable',
    trend: '+1.4%',
  },

  {
    zone: 'PV_Zone_3',
    temperature: 26,
    soilTemp: 22,
    irradiance: 6.4,
    soilMoisture: 49,
    health: 74,
    status: 'Attention',
    trend: '-0.8%',
  },

  {
    zone: 'PV_Zone_4',
    temperature: 22,
    soilTemp: 17,
    irradiance: 5.1,
    soilMoisture: 63,
    health: 89,
    status: 'Healthy',
    trend: '+3.2%',
  },
];

const getHealthColor = (value) => {
  if (value >= 85)
    return {
      color: '#15803d',
      bg: 'rgba(22,163,74,0.08)',
    };

  if (value >= 70)
    return {
      color: '#b45309',
      bg: 'rgba(217,119,6,0.08)',
    };

  return {
    color: '#b91c1c',
    bg: 'rgba(220,38,38,0.08)',
  };
};

const MultiZoneComparison = ({
  cardProps = {},
}) => {
  const [zones, setZones] =
    useState(DEMO_ZONES);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return null;

  return (
  <Card
    sx={{
      overflow: 'hidden',

      borderRadius: '24px',

      background:
        'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',

      border:
        '1px solid rgba(15,23,42,0.06)',

      ...cardProps.sx,
    }}
  >
    <CardContent
      sx={{
        p: 2.2,
      }}
    >
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.4 }}
          >
            <CompareArrowsRoundedIcon
              sx={{
                color: '#2563eb',
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
              }}
            >
              Multi-Zone Analytics
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Comparative monitoring across
            operational production zones.
          </Typography>
        </Box>

        <Chip
          label="4 Active Zones"
          size="small"
          sx={{
            fontWeight: 700,

            backgroundColor:
              'rgba(37,99,235,0.08)',

            color: '#1d4ed8',
          }}
        />
      </Stack>

      {/* TABLE */}
      <Box
        sx={{
          overflowX: 'auto',

          borderRadius: '18px',

          border:
            '1px solid rgba(15,23,42,0.06)',

          background:
            'rgba(255,255,255,0.75)',
        }}
      >
        {/* TABLE HEADER */}
        <Box
          sx={{
            display: 'grid',

            gridTemplateColumns:
              '1.2fr 1fr 1fr 1fr 1fr 1fr',

            gap: 1,

            px: 2,
            py: 1.4,

            background:
              'rgba(248,250,252,0.9)',

            borderBottom:
              '1px solid rgba(15,23,42,0.06)',
          }}
        >
          {[
            'Zone',
            'Temp',
            'Soil Temp',
            'Irradiance',
            'Soil Moisture',
            'Health',
          ].map((item) => (
            <Typography
              key={item}
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              {item}
            </Typography>
          ))}
        </Box>

        {/* TABLE ROWS */}
        {zones.map((zone, index) => {
          const health =
            getHealthColor(
              zone.health
            );

          return (
            <Box
              key={index}
              sx={{
                display: 'grid',

                gridTemplateColumns:
                  '1.2fr 1fr 1fr 1fr 1fr 1fr',

                gap: 1,

                px: 2,
                py: 1.5,

                alignItems: 'center',

                borderBottom:
                  index !==
                  zones.length - 1
                    ? '1px solid rgba(15,23,42,0.05)'
                    : 'none',

                transition:
                  'background 0.2s ease',

                '&:hover': {
                  background:
                    'rgba(248,250,252,0.85)',
                },
              }}
            >
              {/* ZONE */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,

                    borderRadius:
                      '50%',

                    backgroundColor:
                      health.color,
                  }}
                />

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {zone.zone}
                </Typography>
              </Stack>

              {/* TEMP */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {zone.temperature}°C
              </Typography>

              {/* SOIL TEMP */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {zone.soilTemp}°C
              </Typography>

              {/* IRRADIANCE */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {zone.irradiance}
              </Typography>

              {/* MOISTURE */}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {zone.soilMoisture}%
              </Typography>

              {/* HEALTH */}
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,

                    color:
                      health.color,
                  }}
                >
                  {zone.health}%
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={zone.health}
                  sx={{
                    height: 5,

                    borderRadius:
                      '999px',

                    backgroundColor:
                      'rgba(15,23,42,0.06)',

                    '& .MuiLinearProgress-bar':
                      {
                        backgroundColor:
                          health.color,

                        borderRadius:
                          '999px',
                      },
                  }}
                />
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* FOOTER */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          mt: 1.8,
        }}
      >
        <TrendingUpRoundedIcon
          sx={{
            color: '#2563eb',
            fontSize: '1rem',
          }}
        />

        <Typography
          variant="caption"
          sx={{
            color: '#64748b',
            lineHeight: 1.7,
          }}
        >
          Overall operational performance
          remains stable with positive
          agricultural growth indicators
          across most monitored zones.
        </Typography>
      </Stack>
    </CardContent>
  </Card>
);
};

const Metric = ({
  label,
  value,
  positive = true,
}) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
    >
      {label}
    </Typography>

    <Typography
      variant="body1"
      sx={{
        fontWeight: 700,

        color:
          label === 'Trend'
            ? positive
              ? '#15803d'
              : '#b91c1c'
            : '#0f172a',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default MultiZoneComparison;