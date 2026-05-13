/** @jsxImportSource @emotion/react */
import React from 'react';

import {
  Box,
  Typography,
  Stack,
} from '@mui/material';

const zones = [1, 2, 3, 4];

const ZoneSelector = ({
  onZoneSelect,
  currentZone,
}) => {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        flexWrap: 'wrap',
      }}
    >
      {zones.map((zoneNum) => {
        const zoneId = `PV_Zone_${zoneNum}`;

        const isActive =
          currentZone === zoneId;

        return (
          <Box
            key={zoneNum}
            onClick={() =>
              onZoneSelect(zoneId)
            }
            sx={{
              position: 'relative',

              cursor: 'pointer',

              minWidth: 82,

              px: 2,
              py: 1.2,

              borderRadius: '14px',

              background: isActive
                ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
                : '#ffffff',

              border: isActive
                ? '1px solid rgba(59,130,246,0.35)'
                : '1px solid rgba(15,23,42,0.08)',

              boxShadow: isActive
                ? '0 10px 25px rgba(37,99,235,0.22)'
                : '0 1px 2px rgba(15,23,42,0.04)',

              transition: 'all 0.22s ease',

              overflow: 'hidden',

              '&:hover': {
                transform: 'translateY(-2px)',

                boxShadow: isActive
                  ? '0 14px 28px rgba(37,99,235,0.28)'
                  : '0 8px 20px rgba(15,23,42,0.08)',
              },
            }}
          >
            {/* LIVE INDICATOR */}
            {isActive && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,

                  width: 8,
                  height: 8,

                  borderRadius: '50%',

                  backgroundColor: '#22c55e',

                  boxShadow:
                    '0 0 10px rgba(34,197,94,0.9)',
                }}
              />
            )}

            <Typography
              variant="caption"
              sx={{
                display: 'block',

                fontWeight: 700,

                letterSpacing: '0.04em',

                textTransform: 'uppercase',

                color: isActive
                  ? 'rgba(255,255,255,0.7)'
                  : '#64748b',

                mb: 0.4,
              }}
            >
              Zone
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,

                fontSize: '0.95rem',

                color: isActive
                  ? '#ffffff'
                  : '#111827',
              }}
            >
              PV_{zoneNum}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
};

export default ZoneSelector;