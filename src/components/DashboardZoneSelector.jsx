/** @jsxImportSource @emotion/react */
import React from 'react';
import { Button, ButtonGroup, Card } from '@mui/material';

const DashboardZoneSelector = ({ onZoneSelect, currentZone }) => {
  const zones = [1, 2, 3, 4];

  return (
    <Card sx={{ width: '100%', maxWidth: 400 }}>
      <ButtonGroup variant="outlined" aria-label="Zone selector" size="small" sx={{ width: '100%' }}>
        {zones.map(zoneNum => {
          const zoneId = `PV_Zone_${zoneNum}`;
          return (
            <Button
              key={zoneNum}
              variant={currentZone === zoneId ? 'contained' : 'outlined'}
              onClick={() => onZoneSelect(zoneId)}
              sx={{ flex: 1, px: 2, py: 0.5, fontSize: '0.875rem' }}
            >
              Zone {zoneNum}
            </Button>
          )
        })}
      </ButtonGroup>
    </Card>
  );
};

export default DashboardZoneSelector;