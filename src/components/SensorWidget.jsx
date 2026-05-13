/** @jsxImportSource @emotion/react */
import React from 'react';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
} from '@mui/material';

import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

const SENSOR_CONFIG = {
  temperature: {
    color: '#c2410c',
    glow: 'rgba(194,65,12,0.10)',
    demo: '24',
    trend: '+2.4%',
    status: 'Stable',
  },

  soilTemp: {
    color: '#6d28d9',
    glow: 'rgba(109,40,217,0.10)',
    demo: '19',
    trend: '+1.2%',
    status: 'Optimal',
  },

  irradiance: {
    color: '#a16207',
    glow: 'rgba(161,98,7,0.10)',
    demo: '5.8',
    trend: '+8.1%',
    status: 'Good',
  },

  moisture: {
    color: '#0f766e',
    glow: 'rgba(15,118,110,0.10)',
    demo: '61',
    trend: '-1.1%',
    status: 'Healthy',
  },
};

const Sparkline = ({ color }) => (
  <svg
    width="100%"
    height="32"
    viewBox="0 0 120 32"
    preserveAspectRatio="none"
  >
    <path
      d="M0 24 C10 20, 20 12, 30 16 C40 20, 50 10, 60 14 C70 18, 80 6, 90 10 C100 14, 110 8, 120 12"
      stroke={color}
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const SensorWidget = ({
  icon,
  label,
  value,
  unit,
  type = 'temperature',
}) => {
  const config =
    SENSOR_CONFIG[type] ||
    SENSOR_CONFIG.temperature;

  const hasRealData =
    value !== undefined &&
    value !== null &&
    value !== 'ERR';

  const displayValue = hasRealData
    ? value
    : config.demo;

  const isDemo = !hasRealData;

  return (
    <Card
      sx={{
        position: 'relative',

        overflow: 'hidden',

        height: '100%',

        borderRadius: '24px',

        background:
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',

        border:
          '1px solid rgba(15,23,42,0.06)',

        transition: 'all 0.25s ease',

        '&:hover': {
          transform: 'translateY(-4px)',

          boxShadow: `0 18px 35px ${config.glow}`,
        },
      }}
    >
      {/* GLOW ORB */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -30,

          width: 100,
          height: 100,

          borderRadius: '50%',

          background: config.glow,

          filter: 'blur(30px)',
        }}
      />

      <CardContent
        sx={{
          position: 'relative',
          zIndex: 2,

          p: 2.2,
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,

              borderRadius: '18px',

              background: `${config.color}15`,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              color: config.color,

              fontSize: '1.5rem',
            }}
          >
            {icon}
          </Box>

          <Chip
            label={config.status}
            size="small"
            sx={{
              height: 24,

              fontWeight: 700,

              backgroundColor: `${config.color}12`,

              color: config.color,
            }}
          />
        </Stack>

        {/* LABEL */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          {label}
        </Typography>

        {/* VALUE */}
        <Stack
          direction="row"
          alignItems="flex-end"
          spacing={0.6}
          sx={{
            mb: 1.5,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,

              lineHeight: 1,

              color: '#111827',
            }}
          >
            {displayValue}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 0.4,
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            {unit}
          </Typography>
        </Stack>

        {/* TREND */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            mb: 1.8,
          }}
        >
          <TrendingUpRoundedIcon
            sx={{
              fontSize: '1rem',
              color: config.color,
            }}
          />

          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontWeight: 700,
            }}
          >
            {config.trend} today
          </Typography>

          {isDemo && (
            <Chip
              label="Demo"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
              }}
            />
          )}
        </Stack>

        {/* SPARKLINE */}
        <Box
          sx={{
            opacity: 0.9,
          }}
        >
          <Sparkline color={config.color} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SensorWidget;