/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Chip,
  Stack,
  FormGroup,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  Slider,
} from '@mui/material';
import Footer from '../components/Footer.jsx';
import { getUserSettings, updateUserSettings, resetUserSettings } from '../utils/settings.js';

const ZONES = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];

const GROWTH_METRICS = [
  { value: 'average_fruit_size', label: 'Fruit Size' },
  { value: 'growth_speed', label: 'Growth Speed' },
  { value: 'fruit_count', label: 'Fruit Count' },
  { value: 'blossom_area_coverage', label: 'Blossom Coverage' },
];

const TIME_FILTERS = [
  { value: 'month', label: 'Monthly (365 days)' },
  { value: 'weekly', label: 'Weekly (90 days)' },
  { value: 'day', label: 'Daily (30 days)' },
];

const SettingsPage = () => {
  const [settings, setSettings] = useState(getUserSettings());
  const [gdprStatus, setGdprStatus] = useState({
    status: 'unknown',
    timestamp: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const consent = window.localStorage.getItem('gdpr_consent');
      const ts = window.localStorage.getItem('gdpr_consent_timestamp');
      setGdprStatus({
        status: consent || 'none',
        timestamp: ts || null,
      });
    } catch {
      setGdprStatus({ status: 'unknown', timestamp: null });
    }
  }, []);

  const handleSettingChange = (field) => (event) => {
    const value = event.target.value;
    const updated = updateUserSettings({ [field]: value });
    setSettings(updated);
  };

  const handleReset = () => {
    resetUserSettings();
    setSettings(getUserSettings());
  };

  const handleShowGDPR = () => {
    if (window.showGDPRConsent) {
      window.showGDPRConsent();
    }
  };

  const handleWithdrawGDPR = () => {
    if (window.withdrawGDPRConsent) {
      window.withdrawGDPRConsent();
    }
    if (typeof window !== 'undefined') {
      const consent = window.localStorage.getItem('gdpr_consent') || 'none';
      const ts = window.localStorage.getItem('gdpr_consent_timestamp');
      setGdprStatus({
        status: consent,
        timestamp: ts || null,
      });
    }
  };

  const handleToggleChange = (field) => (event) => {
    const value = event.target.checked;
    const updated = updateUserSettings({ [field]: value });
    setSettings(updated);
  };

  const handleAvailabilityChange = (event, value) => {
    const updated = updateUserSettings({ availabilityThreshold: value });
    setSettings(updated);
  };

  const handleSeverityToggle = (severity) => (event) => {
    const currentFilter = settings.alertSeverityFilter || {};
    const nextFilter = { ...currentFilter, [severity]: event.target.checked };
    const updated = updateUserSettings({ alertSeverityFilter: nextFilter });
    setSettings(updated);
  };

  const handleGroupingChange = (event) => {
    const value = event.target.value;
    const updated = updateUserSettings({ alertGroupingMode: value });
    setSettings(updated);
  };

  const renderGDPRChip = () => {
    const status = gdprStatus.status;
    if (status === 'accepted') {
      return <Chip label="Consent: Accepted" size="small" color="success" />;
    }
    if (status === 'rejected') {
      return <Chip label="Consent: Rejected" size="small" color="warning" />;
    }
    if (status === 'unknown') {
      return <Chip label="Consent: Unknown" size="small" color="default" />;
    }
    return <Chip label="Consent: Not given" size="small" color="default" />;
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Settings
      </Typography>

      {/* Dashboard Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold' }}>
            Dashboard Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure how the dashboard looks when you open the platform on this device.
          </Typography>

          <Stack spacing={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="default-zone-label">Default Zone</InputLabel>
              <Select
                labelId="default-zone-label"
                label="Default Zone"
                value={settings.defaultZone}
                onChange={handleSettingChange('defaultZone')}
              >
                {ZONES.map((zone) => (
                  <MenuItem key={zone} value={zone}>
                    {zone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="growth-metric-label">Default Growth Metric</InputLabel>
              <Select
                labelId="growth-metric-label"
                label="Default Growth Metric"
                value={settings.defaultGrowthMetric}
                onChange={handleSettingChange('defaultGrowthMetric')}
              >
                {GROWTH_METRICS.map((metric) => (
                  <MenuItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="time-filter-label">Default Growth Time Range</InputLabel>
              <Select
                labelId="time-filter-label"
                label="Default Growth Time Range"
                value={settings.defaultGrowthTimeFilter}
                onChange={handleSettingChange('defaultGrowthTimeFilter')}
              >
                {TIME_FILTERS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="layout-density-label">Layout Density</InputLabel>
              <Select
                labelId="layout-density-label"
                label="Layout Density"
                value={settings.layoutDensity}
                onChange={handleSettingChange('layoutDensity')}
              >
                <MenuItem value="comfortable">Comfortable</MenuItem>
                <MenuItem value="compact">Compact</MenuItem>
              </Select>
            </FormControl>

            <FormGroup sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showLatestImage}
                    onChange={handleToggleChange('showLatestImage')}
                    size="small"
                  />
                }
                label="Show Latest Field Image"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showGrowthSection}
                    onChange={handleToggleChange('showGrowthSection')}
                    size="small"
                  />
                }
                label="Show Growth & Harvest Prediction section"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showFruitMetrics}
                    onChange={handleToggleChange('showFruitMetrics')}
                    size="small"
                  />
                }
                label="Show Fruit Metrics card"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showGrowthChart}
                    onChange={handleToggleChange('showGrowthChart')}
                    size="small"
                  />
                }
                label="Show Plant Growth Status chart"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showWeatherWidgets}
                    onChange={handleToggleChange('showWeatherWidgets')}
                    size="small"
                  />
                }
                label="Show Weather widgets"
              />
            </FormGroup>

            <Box>
              <Button variant="outlined" size="small" onClick={handleReset}>
                Reset Dashboard Settings
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Alerts & Monitoring Preferences */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold' }}>
            Alerts & Monitoring Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control how alerts and anomaly timelines are displayed on this device.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Visible Alert Severities
            </Typography>
            <FormGroup row>
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <FormControlLabel
                  key={sev}
                  control={
                    <Switch
                      checked={(settings.alertSeverityFilter && settings.alertSeverityFilter[sev]) !== false}
                      onChange={handleSeverityToggle(sev)}
                      size="small"
                    />
                  }
                  label={sev}
                />
              ))}
            </FormGroup>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Alerts Grouping Mode
            </Typography>
            <RadioGroup
              row
              value={settings.alertGroupingMode}
              onChange={handleGroupingChange}
            >
              <FormControlLabel value="time" control={<Radio size="small" />} label="By Time" />
              <FormControlLabel value="zone" control={<Radio size="small" />} label="By Zone" />
              <FormControlLabel value="type" control={<Radio size="small" />} label="By Alert Type" />
              <FormControlLabel value="category" control={<Radio size="small" />} label="By Category" />
            </RadioGroup>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Monitoring Availability Highlight Threshold
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Used by future availability widgets to highlight when uptime drops below this percentage.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={settings.availabilityThreshold}
                onChange={handleAvailabilityChange}
                min={80}
                max={100}
                step={1}
                sx={{ maxWidth: 260 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40 }}>
                {settings.availabilityThreshold}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 'bold' }}>
            Privacy & Data (GDPR)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            View and manage your GDPR consent on this device.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            {renderGDPRChip()}
            {gdprStatus.timestamp && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {new Date(gdprStatus.timestamp).toLocaleString()}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button variant="outlined" size="small" onClick={handleShowGDPR}>
              View GDPR Statement
            </Button>
            <Button variant="text" size="small" color="error" onClick={handleWithdrawGDPR}>
              Withdraw Consent
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      <Footer />
    </Box>
  );
};

export default SettingsPage;