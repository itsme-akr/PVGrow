/**
 * User settings utilities (stored in localStorage).
 *
 * These are per-browser preferences (no auth required):
 * - defaultZone: which PV_Zone is selected by default
 * - defaultGrowthMetric: which growth metric the chart shows by default
 * - defaultGrowthTimeFilter: which time filter (month/weekly/day) is used by default
 * - layoutDensity: 'comfortable' | 'compact'
 * - widget visibility toggles (per device)
 * - anomalyWindowHours: default anomaly window for detections/alerts
 * - alertSeverityFilter: which severities are visible in UI
 * - alertGroupingMode: how alerts are grouped in Alerts page
 * - availabilityThreshold: % threshold for future availability highlighting
 */

const STORAGE_KEY = 'pvgrow_user_settings';

const DEFAULT_SETTINGS = {
  defaultZone: 'PV_Zone_1',
  defaultGrowthMetric: 'average_fruit_size',
  defaultGrowthTimeFilter: 'month',

  // Layout & widgets
  layoutDensity: 'comfortable', // 'comfortable' | 'compact'
  showLatestImage: true,
  showGrowthSection: true,
  showFruitMetrics: true,
  showGrowthChart: true,
  showWeatherWidgets: true,

  // Anomaly window (hours): 24h, 7d, 30d → 24, 168, 720
  anomalyWindowHours: 168, // default: last 7 days

  // Alert preferences
  alertSeverityFilter: {
    CRITICAL: true,
    HIGH: true,
    MEDIUM: true,
    LOW: true,
  },
  alertGroupingMode: 'time', // 'time' | 'zone' | 'type'

  // Monitoring availability (for future UI)
  availabilityThreshold: 95, // %
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getUserSettings = () => {
  if (!isBrowser()) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const updateUserSettings = (updates) => {
  if (!isBrowser()) {
    return { ...DEFAULT_SETTINGS, ...updates };
  }

  const current = getUserSettings();
  const next = { ...current, ...updates };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }

  return next;
};

export const resetUserSettings = () => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
};


