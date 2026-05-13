/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';

import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristRoundedIcon from '@mui/icons-material/LocalFloristRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import GrassRoundedIcon from '@mui/icons-material/GrassRounded';
import AgricultureRoundedIcon from '@mui/icons-material/AgricultureRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';

import {
  getLatestImageAnalysis,
} from '../services/api.js';

import { formatDate } from '../utils/dateFormat.js';

const PHASE_STEPS = [
  {
    stage: 'dormancy',
    label: 'Dormancy',
    color: '#64748b',
    icon: <SpaIcon fontSize="small" />,
    progress: 5,
  },

  {
    stage: 'bud_swell',
    label: 'Bud Swell',
    color: '#8b5cf6',
    icon: <LocalFloristRoundedIcon fontSize="small" />,
    progress: 20,
  },

  {
    stage: 'full_bloom',
    label: 'Full Bloom',
    color: '#ec4899',
    icon: <LocalFloristRoundedIcon fontSize="small" />,
    progress: 40,
  },

  {
    stage: 'fruit_set',
    label: 'Fruit Set',
    color: '#22c55e',
    icon: <ParkRoundedIcon fontSize="small" />,
    progress: 60,
  },

  {
    stage: 'fruit_growth',
    label: 'Fruit Growth',
    color: '#16a34a',
    icon: <GrassRoundedIcon fontSize="small" />,
    progress: 80,
  },

  {
    stage: 'harvest',
    label: 'Harvest',
    color: '#f97316',
    icon: <AgricultureRoundedIcon fontSize="small" />,
    progress: 100,
  },
];

const LEGACY_STAGE_MAP = {
  'off-season': 'dormancy',
  dormancy: 'dormancy',
  bud_swell: 'bud_swell',
  'bud swell': 'bud_swell',
  blooming: 'full_bloom',
  full_bloom: 'full_bloom',
  'full bloom': 'full_bloom',
  fruit_set: 'fruit_set',
  'fruit set': 'fruit_set',
  growing: 'fruit_growth',
  fruit_growth: 'fruit_growth',
  'fruit growth': 'fruit_growth',
  ripening: 'fruit_growth',
  harvest: 'harvest',
  harvesting: 'harvest',
};

const normalizeStage = (stage) => {
  if (!stage) return 'dormancy';

  return (
    LEGACY_STAGE_MAP[stage.toLowerCase()] ||
    'dormancy'
  );
};

const getStageConfig = (stage) => {
  return (
    PHASE_STEPS.find(
      (step) => step.stage === stage
    ) || PHASE_STEPS[0]
  );
};

const GrowthStageBanner = ({ zoneId }) => {
  const [growthData, setGrowthData] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrowthData();
  }, [zoneId]);

  const fetchGrowthData = async () => {
    try {
      const response =
        await getLatestImageAnalysis(zoneId);

      if (
        response.data &&
        response.data.growth_metrics
      ) {
        setGrowthData(response.data.growth_metrics);
      } else {
        setGrowthData(null);
      }
    } catch (err) {
      setGrowthData(null);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilHarvest = (harvestDate) => {
    if (!harvestDate) return null;

    const today = new Date();

    const harvest = new Date(harvestDate);

    const diffTime = harvest - today;

    return Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );
  };

  if (loading) return null;

  const normalizedStage = normalizeStage(
    growthData?.stage || 'dormancy'
  );

  const config = getStageConfig(normalizedStage);

  const activeIndex = PHASE_STEPS.findIndex(
    (step) => step.stage === normalizedStage
  );

  const daysUntilHarvest =
    growthData?.optimal_harvest_time
      ? getDaysUntilHarvest(
          growthData.optimal_harvest_time
        )
      : null;

  return (
    <Card
      sx={{
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2.5,
            md: 3,
          },
        }}
      >
        {/* HEADER */}
        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          justifyContent="space-between"
          alignItems={{
            xs: 'flex-start',
            md: 'center',
          }}
          spacing={2}
          sx={{
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              Growth Intelligence
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Live crop stage monitoring and
              harvest prediction analytics.
            </Typography>
          </Box>

          <Chip
            icon={<TimelineRoundedIcon />}
            label={`Active Zone • ${
              zoneId || 'PV_Zone_1'
            }`}
            sx={{
              fontWeight: 600,
              borderRadius: '999px',
              px: 1,
            }}
          />
        </Stack>

        {/* STAGE TIMELINE */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(95px, max-content))',
              justifyContent: 'space-between',
            gap: 1.2,
            mb: 3,
          }}
        >
          {PHASE_STEPS.map((step, index) => {
            const isActive = index === activeIndex;

            const isCompleted =
              index < activeIndex;

            return (
              <Box
                key={step.stage}
                sx={{
                  position: 'relative',

                  borderRadius: '18px',

                  px: 1.5,
                  py: 1,

                  border: isActive
                    ? `1px solid ${step.color}`
                    : '1px solid rgba(15,23,42,0.06)',

                  background: isActive
                    ? `${step.color}15`
                    : isCompleted
                    ? 'rgba(34,197,94,0.08)'
                    : '#ffffff',

                  transition: 'all 0.25s ease',
                }}
              >
                <Stack
                  spacing={1}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,

                      borderRadius: '50%',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      backgroundColor: isActive
                        ? step.color
                        : isCompleted
                        ? '#22c55e'
                        : '#e5e7eb',

                      color: '#ffffff',
                    }}
                  >
                    {step.icon}
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive
                        ? 700
                        : 600,

                      textAlign: 'center',

                      color: isActive
                        ? step.color
                        : isCompleted
                        ? '#15803d'
                        : '#64748b',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>

        {/* MAIN CONTENT */}
        <GridContainer>
          {/* LEFT */}
          <Box
            sx={{
              flex: 1.2,

              minHeight: 170,

              borderRadius: '22px',

              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',

              border:
                '1px solid rgba(15,23,42,0.06)',

              p: 2.5,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,

                  borderRadius: '20px',

                  backgroundColor: config.color,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  color: '#ffffff',
                }}
              >
                {config.icon}
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Current Growth Stage
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: config.color,
                  }}
                >
                  {config.label}
                </Typography>
              </Box>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={
                growthData?.growth_speed ||
                config.progress
              }
              sx={{
                height: 10,
                borderRadius: '999px',

                backgroundColor:
                  'rgba(15,23,42,0.06)',

                '& .MuiLinearProgress-bar': {
                  backgroundColor: config.color,
                  borderRadius: '999px',
                },
              }}
            />

            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 1.2,
              }}
            >
              <Chip
                label="Stable Growth"
                size="small"
                sx={{
                  backgroundColor:
                    'rgba(34,197,94,0.10)',

                  color: '#15803d',

                  fontWeight: 700,
                }}
              />

              <Chip
                label="Low Risk"
                size="small"
                sx={{
                  backgroundColor:
                    'rgba(37,99,235,0.10)',

                  color: '#1d4ed8',

                  fontWeight: 700,
                }}
              />
            </Stack>

            <Stack
              direction="row"
              spacing={4}
              sx={{
                mt: 2.5,
              }}
            >
              <MetricItem
                label="Growth Speed"
                value={`${
                  growthData?.growth_speed || 0
                }%`}
              />

              <MetricItem
                label="Fruit Count"
                value={
                  growthData?.fruit_count || 0
                }
              />

              <MetricItem
                label="Fruit Size"
                value={`${
                  growthData?.average_fruit_size ||
                  0
                } cm`}
              />
            </Stack>
          </Box>

          {/* RIGHT */}
          <Box
            sx={{
              flex: 0.8,

              borderRadius: '22px',

              background:
                'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',

              border:
                '1px solid rgba(249,115,22,0.18)',

              p: 2.5,

              display: 'flex',
              flexDirection: 'column',
              minHeight: 170,
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#ea580c',
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                Harvest Prediction
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  color: '#ea580c',
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                {daysUntilHarvest ?? '--'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Days remaining until optimal
                harvest window.
              </Typography>
            </Box>

            {growthData?.optimal_harvest_time && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Target harvest date
                </Typography>

                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    mt: 0.5,
                  }}
                >
                  {formatDate(
                    growthData.optimal_harvest_time
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        </GridContainer>
      </CardContent>
    </Card>
  );
};

const MetricItem = ({ label, value }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
    >
      {label}
    </Typography>

    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        mt: 0.5,
      }}
    >
      {value}
    </Typography>
  </Box>
);

const GridContainer = ({ children }) => (
  <Box
    sx={{
      display: 'flex',

      flexDirection: {
        xs: 'column',
        lg: 'row',
      },

      gap: 2.5,
    }}
  >
    {children}
  </Box>
);

export default GrowthStageBanner;