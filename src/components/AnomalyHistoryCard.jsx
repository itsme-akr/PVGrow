/** @jsxImportSource @emotion/react */
import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';

const historyData = [
  { date: '06/04/2025 14:25', id: 142, event: 'Fire Blight' },
  { date: '05/27/2025 10:00', id: 100, event: 'Pear Scab' },
  { date: '05/19/2025 09:2', id: 92, event: 'Sunburn' },
];

const AnomalyHistoryCard = ({ detailed = false }) => (
  <Card sx={{ bgcolor: detailed ? '#ffffff' : '#e3f2fd' }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>Anomaly History</Typography>
      <List dense>
        {historyData.slice(0, detailed ? 3 : 2).map(item => (
          <ListItem key={item.id} disablePadding>
            <ListItemText
              primary={detailed ? `${item.date} ${item.id} ${item.event}` : `${item.date}`}
              secondary={detailed ? null : `${item.event} Alert`}
            />
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);

export default AnomalyHistoryCard;