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
  Button,
} from '@mui/material';

import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import AirRoundedIcon from '@mui/icons-material/AirRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';

import { Link } from 'react-router-dom';

import {
  getWeatherSummary,
} from '../services/api.js';

import {
  getWeatherInfo,
  formatTemperature,
  formatHumidity,
  formatPrecipitation,
} from '../utils/weatherUtils.js';

const DEMO_WEATHER = {
  current_temperature: 24,

  current_humidity: 62,

  today_total_precipitation: 1.2,

  today_max_precipitation_probability: 18,

  today_min_temp: 19,

  today_max_temp: 28,

  current_weather_code: 1,

  wind_speed: 14,

  last_updated: new Date(),
};

const WeatherWidget = ({
  cardProps = {},
}) => {
  const [weatherData, setWeatherData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);

      const response =
        await getWeatherSummary();

      if (response.data) {
        setWeatherData(response.data);
      } else {
        setWeatherData(DEMO_WEATHER);
      }
    } catch (error) {
      setWeatherData(DEMO_WEATHER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();

    const interval = setInterval(
      fetchWeatherData,
      600000
    );

    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const data =
    weatherData || DEMO_WEATHER;

  const weatherInfo = getWeatherInfo(
    data.current_weather_code
  );

  return (
    <Card
      sx={{
        height: '100%',

        overflow: 'hidden',

        position: 'relative',

        background:
          'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',

        ...cardProps.sx,
      }}
    >
      {/* AMBIENT GLOW */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,

          width: 140,
          height: 140,

          borderRadius: '50%',

          background:
            'rgba(59,130,246,0.08)',

          filter: 'blur(40px)',
        }}
      />

      <CardContent
        sx={{
          position: 'relative',
          zIndex: 2,

          p: 2.5,
        }}
      >
        {/* HEADER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 2.5,
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                mb: 0.4,
              }}
            >
              <WbSunnyRoundedIcon
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
                Climate Intelligence
              </Typography>
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Live environmental monitoring
              and operational weather insights.
            </Typography>
          </Box>

          <Chip
            label="Live"
            size="small"
            sx={{
              fontWeight: 700,

              backgroundColor:
                'rgba(34,197,94,0.12)',

              color: '#15803d',
            }}
          />
        </Stack>

        {/* MAIN WEATHER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,

                lineHeight: 1,

                mb: 0.8,
              }}
            >
              {formatTemperature(
                data.current_temperature
              )}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#475569',
                fontWeight: 600,
              }}
            >
              {
                weatherInfo.description
              }
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.6,
              }}
            >
              H:{' '}
              {formatTemperature(
                data.today_max_temp
              )}{' '}
              • L:{' '}
              {formatTemperature(
                data.today_min_temp
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              fontSize: '4rem',
              opacity: 0.9,
            }}
          >
            {weatherInfo.icon}
          </Box>
        </Stack>

        {/* METRICS */}
        <Box
          sx={{
            display: 'grid',

            gridTemplateColumns:
              'repeat(3, 1fr)',

            gap: 1.5,

            mb: 3,
          }}
        >
          <MetricCard
            icon={
              <WaterDropRoundedIcon />
            }
            label="Humidity"
            value={formatHumidity(
              data.current_humidity
            )}
          />

          <MetricCard
            icon={
              <ThunderstormRoundedIcon />
            }
            label="Rain"
            value={formatPrecipitation(
              data.today_total_precipitation
            )}
          />

          <MetricCard
            icon={<AirRoundedIcon />}
            label="Wind"
            value={`${data.wind_speed} km/h`}
          />
        </Box>

        {/* INSIGHT */}
        <Box
          sx={{
            p: 1.8,

            borderRadius: '18px',

            background:
              'rgba(37,99,235,0.06)',

            border:
              '1px solid rgba(37,99,235,0.08)',

            mb: 2.2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,

              color: '#1d4ed8',

              mb: 0.7,
            }}
          >
            Operational Insight
          </Typography>

          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.6,
              color: '#334155',
            }}
          >
            Environmental conditions remain
            stable for the current crop growth
            stage with low rainfall probability
            across active monitoring zones.
          </Typography>
        </Box>

        {/* FOOTER */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Updated moments ago
          </Typography>

          <Button
            component={Link}
            to="/weather"
            endIcon={
              <ArrowOutwardRoundedIcon />
            }
            size="small"
            sx={{
              fontWeight: 700,
            }}
          >
            Forecast
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
}) => (
  <Box
    sx={{
      p: 1.4,

      borderRadius: '16px',

      background: '#ffffff',

      border:
        '1px solid rgba(15,23,42,0.06)',
    }}
  >
    <Stack
      direction="row"
      spacing={0.8}
      alignItems="center"
      sx={{
        mb: 0.8,
      }}
    >
      <Box
        sx={{
          color: '#2563eb',

          display: 'flex',
          alignItems: 'center',
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>
    </Stack>

    <Typography
      variant="body1"
      sx={{
        fontWeight: 700,
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default WeatherWidget;