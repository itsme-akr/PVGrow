/** @jsxImportSource @emotion/react */
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const Header = () => {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - 240px)`, // Adjust width to not overlap sidebar
        ml: `240px`, // Margin left to start after the sidebar
        bgcolor: 'background.default', // Use the light grey background color
        color: '#1a202c',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          
        </Typography>
        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;