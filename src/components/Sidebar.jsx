/** @jsxImportSource @emotion/react */
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';

import { Link as RouterLink, useLocation } from 'react-router-dom';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CloudRoundedIcon from '@mui/icons-material/CloudRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';

import { useAuth } from '../context/AuthContext.jsx';

const navigationSections = [
  {
    title: 'Overview',
    items: [
      {
        text: 'Dashboard',
        icon: <DashboardRoundedIcon />,
        path: '/dashboard',
        roles: ['admin', 'farmer'],
      },
    ],
  },

  {
    title: 'Operations',
    items: [
      {
        text: 'Tasks',
        icon: <ChecklistRoundedIcon />,
        path: '/tasks',
        roles: ['admin', 'farmer'],
      },
      {
        text: 'Alerts',
        icon: <NotificationsRoundedIcon />,
        path: '/alerts',
        roles: ['admin', 'farmer'],
      },
      {
        text: 'Weather',
        icon: <CloudRoundedIcon />,
        path: '/weather',
        roles: ['admin', 'farmer'],
      },
    ],
  },

  {
    title: 'Analytics',
    items: [
      {
        text: 'Analytics',
        icon: <InsightsRoundedIcon />,
        path: '/analytics',
        roles: ['admin', 'farmer'],
      },
    ],
  },

  {
    title: 'Administration',
    items: [
      {
        text: 'Users',
        icon: <AdminPanelSettingsRoundedIcon />,
        path: '/admin/users',
        roles: ['admin'],
      },
      {
        text: 'Settings',
        icon: <SettingsRoundedIcon />,
        path: '/settings',
        roles: ['admin', 'farmer'],
      },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();

  const { user, logout } = useAuth();

  const currentRole = (user?.role || '').toLowerCase();

  return (
    <Box
  sx={{
    width: 270,
    height: '100vh',

    position: 'sticky',
    top: 0,

    display: 'flex',
    flexDirection: 'column',

    flexShrink: 0,

    background:
      'linear-gradient(180deg,#081120 0%,#0f172a 100%)',
  }}
>
      {/* LOGO / BRAND */}
      <Box
        sx={{
          px: 1,
          py: 1.5,
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: '#ffffff',
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          PVGrow
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            mt: 0.5,
          }}
        >
          Smart Agriculture Intelligence
        </Typography>
      </Box>

      {/* NAVIGATION */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
        }}
      >
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(currentRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <Box key={section.title} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  px: 1.5,
                  mb: 1,
                  display: 'block',
                }}
              >
                {section.title}
              </Typography>

              <List disablePadding>
                {visibleItems.map((item) => {
                  const isActive =
                    location.pathname === item.path;

                  return (
                    <ListItem
                      key={item.text}
                      disablePadding
                      sx={{ mb: 0.5 }}
                    >
                      <ListItemButton
                        component={RouterLink}
                        to={item.path}
                        sx={{
                          minHeight: 52,

                          px: 1.5,

                          borderRadius: '16px',

                          backgroundColor: isActive
                            ? 'rgba(37, 99, 235, 0.18)'
                            : 'transparent',

                          border: isActive
                            ? '1px solid rgba(59,130,246,0.25)'
                            : '1px solid transparent',

                          transition: 'all 0.22s ease',

                          '&:hover': {
                            backgroundColor:
                              'rgba(255,255,255,0.06)',
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive
                              ? '#60a5fa'
                              : 'rgba(255,255,255,0.7)',

                            minWidth: 40,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>

                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.95rem',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive
                              ? '#ffffff'
                              : '#cbd5e1',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* FOOTER */}
      <Box sx={{ pt: 2 }}>
        <Divider
          sx={{
            borderColor: 'rgba(255,255,255,0.06)',
            mb: 2,
          }}
        />

        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => logout()}
              sx={{
                minHeight: 52,
                px: 1.5,
                borderRadius: '16px',

                '&:hover': {
                  backgroundColor: 'rgba(239,68,68,0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  minWidth: 40,
                }}
              >
                <LogoutRoundedIcon />
              </ListItemIcon>

              <ListItemText
                primary="Log out"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: '#cbd5e1',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default Sidebar;