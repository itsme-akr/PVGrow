/** @jsxImportSource @emotion/react */
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const GrowthStageIndicator = () => {
  // Hardcoded data for the MVP demo
  const stages = ['Blooming', 'Budding', 'Growing', 'Harvesting'];
  const currentStage = 'Growing';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Growth Stage
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, position: 'relative' }}>
          {/* Background Line */}
          <Box sx={{ position: 'absolute', width: '100%', height: '4px', bgcolor: '#e0e0e0', top: '10px', left: 0 }} />
          
          {/* Foreground (Progress) Line */}
          <Box sx={{ position: 'absolute', width: `${(stages.indexOf(currentStage) / (stages.length - 1)) * 100}%`, height: '4px', bgcolor: 'primary.main', top: '10px', left: 0 }} />

          {stages.map((stage) => {
            const isActive = stage === currentStage;
            const isCompleted = stages.indexOf(stage) < stages.indexOf(currentStage);

            return (
              <Box key={stage} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%',
                  bgcolor: isActive || isCompleted ? 'primary.main' : '#e0e0e0',
                  border: '4px solid #f4f6f8', // Same as background to create a "cutout" look
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted && <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />}
                </Box>
                <Typography variant="caption" sx={{ mt: 1, fontWeight: isActive ? 'bold' : 'normal' }}>
                  {stage}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GrowthStageIndicator;
