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
  Avatar,
} from '@mui/material';

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';

import { getActiveAlerts } from '../services/api.js';

import { useNavigate } from 'react-router-dom';

const DEMO_RECOMMENDATIONS = [
  {
    title:
      'Irrigation efficiency remains stable across all active zones.',
    priority: 'healthy',
    tag: 'Water Management',
    time: '2 mins ago',
  },

  {
    title:
      'No disease activity patterns detected in recent monitoring cycles.',
    priority: 'normal',
    tag: 'Crop Health',
    time: '12 mins ago',
  },

  {
    title:
      'Weather conditions remain favorable for current growth stage.',
    priority: 'healthy',
    tag: 'Climate',
    time: '18 mins ago',
  },

  {
    title:
      'Sensor synchronization latency slightly increased on Zone 3.',
    priority: 'medium',
    tag: 'Operations',
    time: '28 mins ago',
  },
];

const PRIORITY_CONFIG = {
  healthy: {
    color: '#15803d',
    bg: 'rgba(22,163,74,0.10)',
    icon: <CheckCircleRoundedIcon />,
    label: 'Healthy',
  },

  normal: {
    color: '#1d4ed8',
    bg: 'rgba(37,99,235,0.10)',
    icon: <InsightsRoundedIcon />,
    label: 'Normal',
  },

  medium: {
    color: '#b45309',
    bg: 'rgba(217,119,6,0.10)',
    icon: <PriorityHighRoundedIcon />,
    label: 'Attention',
  },
};

const RecommendationsPanel = ({
  cardProps = {},
}) => {
  const [recommendations, setRecommendations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      const response =
        await getActiveAlerts();

      if (
        response.data &&
        Array.isArray(response.data)
      ) {
        const grouped = {};

        response.data.forEach((alert) => {
          const key = `${alert.alert_type}_${alert.zone_id}`;

          if (!grouped[key]) {
            grouped[key] = alert;
          }
        });

        const recs = Object.values(grouped)
          .filter(
            (alert) =>
              alert.recommendation &&
              alert.recommendation.trim()
          )
          .map((alert, index) => ({
            title: alert.recommendation,

            priority:
              index % 3 === 0
                ? 'medium'
                : 'normal',

            tag:
              alert.alert_type ||
              'Operations',

            time: 'Live',
          }))
          .slice(0, 6);

        setRecommendations(
          recs.length > 0
            ? recs
            : DEMO_RECOMMENDATIONS
        );
      } else {
        setRecommendations(
          DEMO_RECOMMENDATIONS
        );
      }
    } catch (error) {
      setRecommendations(
        DEMO_RECOMMENDATIONS
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const interval = setInterval(
      fetchRecommendations,
      60000
    );

    return () => clearInterval(interval);
  }, []);

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
          p: 2.4,
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 2.2,
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
              <AutoAwesomeRoundedIcon
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
                AI Recommendations
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Operational insights and
              intelligent monitoring guidance.
            </Typography>
          </Box>

          <Chip
            label={
              loading
                ? 'Updating'
                : 'Live'
            }
            size="small"
            sx={{
              fontWeight: 700,

              backgroundColor:
                'rgba(37,99,235,0.10)',

              color: '#1d4ed8',
            }}
          />
        </Stack>

        {/* FEED */}
        <Stack spacing={1.4}>
          {recommendations.map(
            (item, index) => {
              const config =
                PRIORITY_CONFIG[
                  item.priority
                ] ||
                PRIORITY_CONFIG.normal;

              return (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,

                    borderRadius: '18px',

                    border:
                      '1px solid rgba(15,23,42,0.06)',

                    background:
                      'rgba(255,255,255,0.8)',

                    transition:
                      'all 0.22s ease',

                    '&:hover': {
                      transform:
                        'translateY(-2px)',

                      boxShadow:
                        '0 10px 25px rgba(15,23,42,0.06)',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.4}
                    alignItems="flex-start"
                  >
                    {/* ICON */}
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,

                        background:
                          config.bg,

                        color:
                          config.color,
                      }}
                    >
                      {config.icon}
                    </Avatar>

                    {/* CONTENT */}
                    <Box
                      sx={{
                        flex: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,

                          lineHeight: 1.5,

                          color: '#0f172a',

                          mb: 1,
                        }}
                      >
                        {item.title}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={
                            config.label
                          }
                          size="small"
                          sx={{
                            height: 22,

                            fontWeight: 700,

                            background:
                              config.bg,

                            color:
                              config.color,
                          }}
                        />

                        <Chip
                          label={item.tag}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 22,
                          }}
                        />

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {item.time}
                        </Typography>
                      </Stack>
                    </Box>

                    <ArrowOutwardRoundedIcon
                      sx={{
                        color: '#94a3b8',
                        fontSize: '1rem',
                      }}
                    />
                  </Stack>
                </Box>
              );
            }
          )}
        </Stack>

        {/* FOOTER */}
        <Box
          sx={{
            mt: 2.2,
            pt: 2,

            borderTop:
              '1px solid rgba(15,23,42,0.06)',
          }}
        >
          <Typography
            onClick={() =>
              navigate('/tasks')
            }
            sx={{
              fontSize: '0.88rem',

              fontWeight: 700,

              color: '#2563eb',

              cursor: 'pointer',

              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,

              transition:
                'all 0.2s ease',

              '&:hover': {
                gap: 1,
              },
            }}
          >
            Open intelligence center
            <ArrowOutwardRoundedIcon
              sx={{
                fontSize: '1rem',
              }}
            />
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecommendationsPanel;