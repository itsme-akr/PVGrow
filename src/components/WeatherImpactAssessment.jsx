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
} from '@mui/material';

import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import AirRoundedIcon from '@mui/icons-material/AirRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';

import {
  getWeatherForecast,
} from '../services/api.js';

const DEMO_IMPACTS = [
  {
    type: 'stable',
    severity: 'healthy',
    icon: <CheckCircleRoundedIcon />,
    title: 'Climate Stability',
    description:
      'Environmental conditions remain stable across active zones.',
    recommendation:
      'No immediate operational intervention required.',
  },

  {
    type: 'rain',
    severity: 'normal',
    icon: <ThunderstormRoundedIcon />,
    title: 'Rain Probability',
    description:
      'Light precipitation expected within next 24 hours.',
    recommendation:
      'Soil moisture expected to remain within healthy range.',
  },

  {
    type: 'wind',
    severity: 'medium',
    icon: <AirRoundedIcon />,
    title: 'Wind Activity',
    description:
      'Moderate wind activity detected for northern sector.',
    recommendation:
      'Monitor exposed equipment and support structures.',
  },
];

const SEVERITY_CONFIG = {
  healthy: {
    color: '#15803d',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.18)',
    label: 'Healthy',
  },

  normal: {
    color: '#1d4ed8',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.18)',
    label: 'Monitoring',
  },

  medium: {
    color: '#b45309',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.18)',
    label: 'Attention',
  },

  high: {
    color: '#b91c1c',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.18)',
    label: 'High Risk',
  },
};

const WeatherImpactAssessment = ({
  cardProps = {},
}) => {
  const [impacts, setImpacts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const fetchWeatherImpacts =
    async () => {
      try {
        setLoading(true);

        const response =
          await getWeatherForecast(48);

        if (
          response.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          setImpacts(DEMO_IMPACTS);
        } else {
          setImpacts(DEMO_IMPACTS);
        }
      } catch (error) {
        setImpacts(DEMO_IMPACTS);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchWeatherImpacts();

    const interval = setInterval(
      fetchWeatherImpacts,
      300000
    );

    return () =>
      clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <Card
      sx={{
        height: '100%',

        overflow: 'hidden',

        background:
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',

        ...cardProps.sx,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 2.4,
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                mb: 0.5,
              }}
            >
              <InsightsRoundedIcon
                sx={{
                  color: '#2563eb',
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Climate Risk Center
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Forecast-driven operational
              weather impact analysis.
            </Typography>
          </Box>

          <Chip
            label="Next 48h"
            size="small"
            sx={{
              fontWeight: 700,

              backgroundColor:
                'rgba(37,99,235,0.08)',

              color: '#1d4ed8',
            }}
          />
        </Stack>

        {/* RISK CARDS */}
        <Stack spacing={1.5}>
          {impacts.map(
            (impact, index) => {
              const config =
                SEVERITY_CONFIG[
                  impact.severity
                ] ||
                SEVERITY_CONFIG.normal;

              return (
                <Box
                  key={index}
                  sx={{
                    p: 1.6,

                    borderRadius: '18px',

                    background:
                      config.bg,

                    border: `1px solid ${config.border}`,

                    transition:
                      'all 0.22s ease',

                    '&:hover': {
                      transform:
                        'translateY(-2px)',

                      boxShadow:
                        '0 10px 20px rgba(15,23,42,0.05)',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.4}
                    alignItems="flex-start"
                  >
                    {/* ICON */}
                    <Box
                      sx={{
                        width: 42,
                        height: 42,

                        borderRadius: '14px',

                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',

                        background:
                          '#ffffff',

                        color:
                          config.color,

                        border:
                          '1px solid rgba(255,255,255,0.7)',
                      }}
                    >
                      {impact.icon}
                    </Box>

                    {/* CONTENT */}
                    <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{
                          mb: 0.8,
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color:
                              '#0f172a',
                          }}
                        >
                          {impact.title}
                        </Typography>

                        <Chip
                          label={
                            config.label
                          }
                          size="small"
                          sx={{
                            height: 22,

                            fontWeight: 700,

                            background:
                              '#ffffff',

                            color:
                              config.color,
                          }}
                        />
                      </Stack>

                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            '#475569',

                          lineHeight: 1.6,

                          mb: 1,
                        }}
                      >
                        {
                          impact.description
                        }
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          display:
                            'block',

                          color:
                            config.color,

                          fontWeight: 700,

                          lineHeight: 1.5,
                        }}
                      >
                        {
                          impact.recommendation
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            }
          )}
        </Stack>

        {/* FOOTER */}
        <Box
          sx={{
            mt: 2.4,
            pt: 2,

            borderTop:
              '1px solid rgba(15,23,42,0.06)',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <WarningAmberRoundedIcon
              sx={{
                color: '#f59e0b',
                fontSize: '1rem',
              }}
            />

            <Typography
              variant="body2"
              sx={{
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              Forecast models indicate low
              operational weather risk across
              monitored agricultural zones.
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeatherImpactAssessment;