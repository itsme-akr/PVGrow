/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, Stack, } from '@mui/material';
import { getLatestImageForZone, getImageUrl, getLatestImageAnalysis } from '../services/api.js';
import { formatTimestampWithComma } from '../utils/dateFormat.js';

const AnomalyImageViewer = ({ selectedZone = "PV_Zone_1", size = "medium" }) => {
  const [imageInfo, setImageInfo] = useState(null);
  const [captureTimestamp, setCaptureTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Size configurations
  const sizeConfig = {
    small: { cardWidth: '100%', maxCardWidth: '495px', maxImageHeight: '380px', margin: '0 auto' },
    medium: { cardWidth: '100%', maxCardWidth: 'none', maxImageHeight: '260px', margin: '0' },
    large: { cardWidth: '100%', maxCardWidth: 'none', maxImageHeight: '600px', margin: '0' }
  };
  
  const config = sizeConfig[size] || sizeConfig.medium;

  // Helper function to get status based on timestamp age
  const getDataStatus = (timestamp) => {
    if (!timestamp) return { status: 'offline', label: 'No Data', color: 'error' };
    
    const now = new Date();
    const dataTime = new Date(timestamp);
    const ageMinutes = (now - dataTime) / (1000 * 60);
    
    if (ageMinutes < 10) {
      return { status: 'live', label: 'Live', color: 'success' };
    } else if (ageMinutes < 30) {
      return { status: 'delayed', label: 'Delayed', color: 'warning' };
    } else {
      return { status: 'offline', label: 'Offline', color: 'error' };
    }
  };

  const fetchLatestImage = async (zoneId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch the latest analysis first so we can show the true capture time.
      // Use order_by=detection to get the most recently detected image, not most recently uploaded
      try {
        const analysisResponse = await getLatestImageAnalysis(zoneId, 'detection');
        if (analysisResponse.data && analysisResponse.data.image_id) {
          setImageInfo({
            image_id: analysisResponse.data.image_id,
            zone_id: analysisResponse.data.zone_id,
            source: 'analysis',
            captured_at: analysisResponse.data.timestamp,
            uploaded_at: analysisResponse.data.created_at,
          });
          setCaptureTimestamp(analysisResponse.data.timestamp);
          setLoading(false);
          return;
        }
      } catch (analysisError) {
        if (analysisError?.response?.status !== 404) {
          console.warn(`Failed to fetch analysis for ${zoneId}:`, analysisError);
        }
      }

      // Fallback: fetch the latest image by capture time (likely missing analysis data).
      const response = await getLatestImageForZone(zoneId, 'capture');
      if (response.data) {
        setImageInfo({
          image_id: response.data.id,
          zone_id: response.data.zone_id,
          source: 'upload',
          uploaded_at: response.data.upload_timestamp,
        });
        setCaptureTimestamp(response.data.upload_timestamp);
      } else {
        setImageInfo(null);
        setCaptureTimestamp(null);
      }
    } catch (error) {
      console.error(`Error fetching image for zone ${zoneId}:`, error);
      setError('Failed to load image');
      setImageInfo(null);
      setCaptureTimestamp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestImage(selectedZone);
    
    // Refresh image every 2 minutes
    const interval = setInterval(() => {
      fetchLatestImage(selectedZone);
    }, 120000);

    return () => clearInterval(interval);
  }, [selectedZone]);

  // Use unified timestamp format: DD-MM-YYYY, HH:MM:SS
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return formatTimestampWithComma(timestamp);
  };

  return (
  <Box
    sx={{
      width: '100%',
      height: '100%',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1,
      }}
    >
      <Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 0.5 }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
            }}
          >
            AI Field Monitoring
          </Typography>

          <Chip
            label="Vision AI"
            size="small"
            sx={{
              height: 22,

              backgroundColor:
                'rgba(59,130,246,0.10)',

              color: '#2563eb',

              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Live crop imagery analysis feed
        </Typography>
      </Box>

      {imageInfo && captureTimestamp && (
        <Chip
          label={
            getDataStatus(captureTimestamp)
              .label
          }
          color={
            getDataStatus(captureTimestamp)
              .color
          }
          size="small"
          sx={{ fontSize: '0.7rem' }}
        />
      )}
    </Box>

    {loading ? (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 220,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Loading latest image...
        </Typography>
      </Box>
    ) : error ? (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 220,
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography
          variant="body2"
          color="error"
        >
          {error}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          No images available for{' '}
          {selectedZone}
        </Typography>
      </Box>
    ) : imageInfo ? (
      <>
        <Box
          component="img"
          src={getImageUrl(imageInfo.image_id)}
          alt={`Latest field image for ${
            imageInfo.zone_id ||
            selectedZone
          }`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          sx={{
            width: '100%',
            height: 'auto',
            maxHeight:
              config.maxImageHeight,
            objectFit: 'contain',
            display: 'block',
            borderRadius: 1,
            mt: 1,
          }}
          onError={(e) => {
            console.error(
              'Image failed to load:',
              e
            );
            setError(
              'Image failed to load'
            );
          }}
        />

        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Zone:{' '}
            {imageInfo.zone_id ||
              selectedZone}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {formatTimestamp(
              captureTimestamp
            )}
          </Typography>
        </Box>
      </>
    ) : (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 220,
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          No images uploaded yet
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Waiting for CV team uploads
          for {selectedZone}
        </Typography>
      </Box>
    )}
  </Box>
);
};

export default AnomalyImageViewer;