const CATEGORY = {
  WEATHER_ENVIRONMENT: 'weather_environment',
  TREE_GROWTH_MAINTENANCE: 'tree_growth_maintenance',
  PLANT_HEALTH_DISEASES: 'plant_health_diseases',
  SYSTEM_SENSOR_STATUS: 'system_sensor_status',
  OTHER: 'other',
};

const CATEGORY_LABELS = {
  [CATEGORY.WEATHER_ENVIRONMENT]: 'Weather & Environmental Events',
  [CATEGORY.TREE_GROWTH_MAINTENANCE]: 'Tree Growth & Maintenance',
  [CATEGORY.PLANT_HEALTH_DISEASES]: 'Plant Health & Diseases',
  [CATEGORY.SYSTEM_SENSOR_STATUS]: 'System & Sensor Status',
  [CATEGORY.OTHER]: 'Other',
};

const CATEGORY_COLORS = {
  [CATEGORY.WEATHER_ENVIRONMENT]: '#42a5f5',
  [CATEGORY.TREE_GROWTH_MAINTENANCE]: '#ffb300',
  [CATEGORY.PLANT_HEALTH_DISEASES]: '#ef5350',
  [CATEGORY.SYSTEM_SENSOR_STATUS]: '#8d6e63',
  [CATEGORY.OTHER]: '#9e9e9e',
};

const TITLE_OVERRIDES = {
  fire_blight: 'Fire Blight Detection',
  pear_rust: 'Pear Rust Detection',
  possible_frost_alert: 'Possible Frost Alert',
  confirmed_frost_event: 'Confirmed Frost Event',
  possible_hail_storm_alert: 'Possible Hail Storm Alert',
  confirmed_hail_storm_event: 'Confirmed Hail Storm Event',
  sunburn_risk_warning: 'Sunburn Risk Warning',
  under_watering_detection: 'Underwatering Detection',
  over_watering_detection: 'Overwatering Detection',
  tree_overgrowth: 'Tree Overgrowth (Trimming Need)',
  clustered_fruit: 'Clustered Fruit - Thinning Indicator',
  harvest_date_prediction: 'Harvest Date Prediction',
  sensor_offline: 'Sensor Offline',
  camera_offline: 'Camera Offline',
};

export const alertCategories = Object.values(CATEGORY);

export const getAlertCategoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS[CATEGORY.OTHER];

export const getAlertCategoryColor = (category) => CATEGORY_COLORS[category] || CATEGORY_COLORS[CATEGORY.OTHER];

export const normalizeAlertType = (alertType = '') => {
  return String(alertType || '').trim().toLowerCase().replace(/\s+/g, '_');
};

export const getAlertCategoryFromAlertType = (alertType) => {
  const type = normalizeAlertType(alertType);

  if (
    type.includes('frost') ||
    type.includes('freeze') ||
    type.includes('hail') ||
    type.includes('sunburn') ||
    type.includes('storm') ||
    type.includes('weather') ||
    type.includes('wind') ||
    type.includes('heat') ||
    type.includes('rain') ||
    type.includes('snow') ||
    type.includes('ice') ||
    type.includes('cold') ||
    type.includes('temperature')
  ) {
    return CATEGORY.WEATHER_ENVIRONMENT;
  }

  if (
    type.includes('under_watering') ||
    type.includes('over_watering') ||
    type.includes('under_irrigation') ||
    type.includes('over_irrigation') ||
    type.includes('irrigation') ||
    type.includes('trimming') ||
    type.includes('pruning') ||
    type.includes('overgrowth') ||
    type.includes('cluster') ||
    type.includes('thinning') ||
    type.includes('harvest') ||
    type.includes('growth')
  ) {
    return CATEGORY.TREE_GROWTH_MAINTENANCE;
  }

  if (
    type.includes('rust') ||
    type.includes('blight') ||
    type.includes('scab') ||
    type.includes('disease') ||
    type.includes('crack')
  ) {
    return CATEGORY.PLANT_HEALTH_DISEASES;
  }

  if (
    type.includes('sensor') ||
    type.includes('camera') ||
    type.includes('offline') ||
    type.includes('connectivity') ||
    type.includes('system')
  ) {
    return CATEGORY.SYSTEM_SENSOR_STATUS;
  }

  return CATEGORY.OTHER;
};

export const getAlertTypeDisplayLabel = (alertType) => {
  const type = normalizeAlertType(alertType);
  if (TITLE_OVERRIDES[type]) return TITLE_OVERRIDES[type];
  return type.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
};

export const getDetectionCategory = (detection) => {
  if (!detection) return CATEGORY.OTHER;

  if (detection.is_alert) {
    return getAlertCategoryFromAlertType(detection.alert_type || detection.label);
  }

  const label = String(detection.label || '').toLowerCase();
  const type = String(detection.type || '').toLowerCase();

  if (label.includes('cluster') || type.includes('maintenance') || label.includes('trim') || label.includes('prun')) {
    return CATEGORY.TREE_GROWTH_MAINTENANCE;
  }
  if (type.includes('disease') || label.includes('rust') || label.includes('blight') || label.includes('disease')) {
    return CATEGORY.PLANT_HEALTH_DISEASES;
  }
  if (label.includes('frost') || label.includes('hail') || label.includes('sunburn')) {
    return CATEGORY.WEATHER_ENVIRONMENT;
  }
  if (label.includes('sensor') || label.includes('camera') || label.includes('offline')) {
    return CATEGORY.SYSTEM_SENSOR_STATUS;
  }

  return CATEGORY.OTHER;
};
