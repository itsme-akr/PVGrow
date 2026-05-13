import axios from 'axios';

// API URL configuration based on environment
const API_URL = import.meta.env.VITE_API_URL || 
                import.meta.env.VITE_DEV_API_URL || 
                'http://localhost:8000/api/v1';

console.log('API URL:', API_URL);

// Create an axios instance for making requests
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// --- AUTH HELPERS ---

export const loginRequest = async (email, password) => {
  // Backend expects OAuth2PasswordRequestForm (username + password) as form-data
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const response = await apiClient.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

export const registerRequest = async (email, password, fullName = '') => {
  // Registration uses JSON body with email, password, and optional full_name
  const payload = {
    email,
    password,
    full_name: fullName || undefined,
  };
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
};

export const getCurrentUserProfile = async () => {
  return apiClient.get('/auth/me');
};

export const verifyEmailRequest = async (token) => {
  const response = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  return response.data;
};

export const resendVerificationRequest = async (email) => {
  const response = await apiClient.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get('/auth/users');
  return response.data;
};

export const updateUserRoleRequest = async (userId, role) => {
  const response = await apiClient.patch(`/auth/users/${userId}/role`, { role });
  return response.data;
};

export const requestPasswordResetRequest = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordRequest = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return response.data;
};

// --- EXISTING API FUNCTIONS ---

// Function to get the latest sensor reading for a specific zone
export const getLatestReadingForZone = async (zoneId) => {
  try {
    console.log(`Fetching data for zone: ${zoneId}`);
    const response = await apiClient.get(`/readings/latest/${encodeURIComponent(zoneId)}`);
    
    console.log(`Received data for ${zoneId}:`, response.data);
    return response;
  } catch (error) {
    console.error(`Error fetching data for zone ${zoneId}:`, error);
    // NO MOCK DATA - Enterprise production system
    throw error;
  }
};

// Function to get all active alerts
export const getActiveAlerts = async () => {
  try {
    console.log('Fetching active alerts from backend...');
    const response = await apiClient.get('/alerts/active');
    console.log('Active alerts response:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    // Return empty array instead of fake alerts - let the UI handle the empty state
    return {
      data: []
    };
  }
};

// Function to get historical alerts (paginated)
// Optional `timeout` overrides the default 10s client limit (needed when many pages run on a slow NAS).
export const getAlertHistory = async ({
  days = 365,
  page = 1,
  per_page = 50,
  zoneId,
  alertType,
  timeout,
} = {}) => {
  try {
    const params = new URLSearchParams({
      days: days.toString(),
      page: page.toString(),
      per_page: per_page.toString(),
    });
    if (zoneId) params.append('zone_id', zoneId);
    if (alertType) params.append('alert_type', alertType);
    const response = await apiClient.get(`/alerts/history?${params.toString()}`, {
      ...(timeout != null ? { timeout } : {}),
    });
    return response;
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return { data: { total: 0, page: 1, per_page: 50, alerts: [] } };
  }
};

// Function to trigger data ingestion manually
export const triggerDataIngestion = async () => {
  try {
    console.log('Triggering data ingestion...');
    const response = await apiClient.post('/ingest');
    console.log('Data ingestion triggered successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error triggering data ingestion:', error);
    throw error;
  }
};

// Function to get the latest image for a specific zone
export const getLatestImageForZone = async (zoneId, orderBy = 'capture') => {
  try {
    console.log(`Fetching latest image for zone: ${zoneId}, order_by: ${orderBy}`);
    const response = await apiClient.get(`/images/latest/${encodeURIComponent(zoneId)}?order_by=${orderBy}`);
    console.log(`Latest image data for ${zoneId}:`, response.data);
    return response;
  } catch (error) {
    console.error(`Error fetching latest image for zone ${zoneId}:`, error);
    // Return null if no image found instead of throwing
    if (error.response?.status === 404) {
      return { data: null };
    }
    throw error;
  }
};

// Function to get list of images for a specific zone
export const getImagesForZone = async (zoneId, limit = 10) => {
  try {
    console.log(`Fetching images for zone: ${zoneId}`);
    const response = await apiClient.get(`/images/list/${encodeURIComponent(zoneId)}?limit=${limit}`);
    console.log(`Images list for ${zoneId}:`, response.data);
    return response;
  } catch (error) {
    console.error(`Error fetching images for zone ${zoneId}:`, error);
    return { data: [] };
  }
};

// Function to build image URL for display
export const getImageUrl = (imageId) => {
  if (!imageId) return null;
  return `${API_URL}/images/serve/${imageId}`;
};

// Weather API Functions
// Function to get current weather conditions
export const getCurrentWeather = async () => {
  try {
    console.log('Fetching current weather...');
    const response = await apiClient.get('/weather/current');
    console.log('Current weather data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return { data: null };
  }
};

// Function to get weather summary for dashboard widget
export const getWeatherSummary = async () => {
  try {
    console.log('Fetching weather summary...');
    const response = await apiClient.get('/weather/summary');
    console.log('Weather summary data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching weather summary:', error);
    return { data: null };
  }
};

// Function to get weather forecast
export const getWeatherForecast = async (hours = 24) => {
  try {
    console.log(`Fetching weather forecast for ${hours} hours...`);
    const response = await apiClient.get(`/weather/forecast?hours=${hours}`);
    console.log('Weather forecast data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return { data: [] };
  }
};

// Function to manually trigger weather update
export const triggerWeatherUpdate = async () => {
  try {
    console.log('Triggering weather update...');
    const response = await apiClient.post('/weather/update-forecast');
    console.log('Weather update triggered successfully:', response.data);
    return response;
  } catch (error) {
    console.error('Error triggering weather update:', error);
    throw error;
  }
};

// Detection/Analysis API Functions
// Large `hours` scans many ImageAnalysis rows. Default axios timeout is 10s; when alert history
// pagination runs in parallel (anomaly timeline), DB latency can exceed that and the client
// returns empty detections — image/CV bars disappear while alert-only series still show.
const detectionsTimeoutMs = (hours) => {
  if (hours > 24 * 180) return 300000; // ~6+ months
  if (hours > 24 * 30) return 120000; // > 30 days
  if (hours > 24 * 7) return 60000; // > 7 days
  return 10000;
};

// Function to get recent detections for disease monitoring
export const getRecentDetections = async (hours = 24, zoneId = null, axiosOptions = {}) => {
  try {
    console.log(`Fetching recent detections for last ${hours} hours...`);
    const params = new URLSearchParams({ hours: hours.toString() });
    if (zoneId) {
      params.append('zone_id', zoneId);
    }
    const timeout = axiosOptions.timeout ?? detectionsTimeoutMs(hours);
    const response = await apiClient.get(`/images/detections/recent?${params.toString()}`, {
      ...axiosOptions,
      timeout,
    });
    console.log('Recent detections data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching recent detections:', error);
    return { data: { detections: [], total_count: 0, time_range_hours: hours } };
  }
};

// Function to get detection summary statistics
export const getDetectionsSummary = async () => {
  try {
    console.log('Fetching detections summary...');
    const response = await apiClient.get('/images/detections/summary');
    console.log('Detections summary data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching detections summary:', error);
    return { data: { today: {}, week: {}, by_zone: {}, by_type: {} } };
  }
};

// Function to get latest image analysis for a specific zone (growth metrics + detections)
export const getLatestImageAnalysis = async (zoneId, orderBy = 'upload') => {
  try {
    console.log(`Fetching latest image analysis for zone: ${zoneId}, order_by: ${orderBy}`);
    const response = await apiClient.get(`/images/image-analysis/latest/${encodeURIComponent(zoneId)}?order_by=${orderBy}`);
    return response;
  } catch (error) {
    console.error(`Error fetching latest image analysis for ${zoneId}:`, error);
    // Return null if no analysis found (expected if CV team hasn't uploaded yet)
    if (error.response?.status === 404) {
      return { data: null };
    }
    return { data: null };
  }
};

// Function to get latest image analysis for all zones (growth metrics + detections)
export const getLatestImageAnalysesAll = async (zoneIds = []) => {
  try {
    const params = new URLSearchParams();
    if (zoneIds.length > 0) {
      params.append('zone_ids', zoneIds.join(','));
    }
    const query = params.toString();
    const url = `/images/image-analysis/latest${query ? `?${query}` : ''}`;
    console.log('Fetching latest image analyses for zones:', zoneIds.length ? zoneIds : 'all');
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.error('Error fetching latest image analyses:', error);
    return { data: {} };
  }
};

// Function to get all image analyses for a zone (for historical aggregation)
export const getAllImageAnalysesForZone = async (zoneId, days = 365) => {
  try {
    console.log(`Fetching all image analyses for zone: ${zoneId} (last ${days} days)`);
    // Use longer timeout for this endpoint as it can return large datasets
    const response = await apiClient.get(
      `/images/image-analysis/all/${encodeURIComponent(zoneId)}?days=${days}`,
      { timeout: 30000 } // 30 second timeout
    );
    return response;
  } catch (error) {
    console.error(`Error fetching all image analyses for ${zoneId}:`, error);
    if (error.response?.status === 404) {
      return { data: { zone_id: zoneId, analyses: [], date_range: null, total_count: 0 } };
    }
    return { data: { zone_id: zoneId, analyses: [], date_range: null, total_count: 0 } };
  }
};

// Function to get latest sensor readings for all zones (for multi-zone comparison)
export const getAllZonesLatestReadings = async () => {
  try {
    console.log('Fetching latest readings for all zones...');
    const zones = ['PV_Zone_1', 'PV_Zone_2', 'PV_Zone_3', 'PV_Zone_4'];
    
    // Fetch all zones in parallel
    const promises = zones.map(zone => getLatestReadingForZone(zone));
    const results = await Promise.allSettled(promises);
    
    // Map results to zone data
    const zoneData = {};
    results.forEach((result, index) => {
      const zone = zones[index];
      if (result.status === 'fulfilled' && result.value?.data) {
        zoneData[zone] = result.value.data;
      } else {
        zoneData[zone] = null;
      }
    });
    
    console.log('All zones data:', zoneData);
    return { data: zoneData };
  } catch (error) {
    console.error('Error fetching all zones data:', error);
    return { data: {} };
  }
};

// Function to get historical sensor readings for a zone
export const getHistoricalReadings = async (zoneId, days = 7) => {
  try {
    console.log(`Fetching historical readings for ${zoneId} over ${days} days...`);
    const response = await apiClient.get(`/readings/history/${encodeURIComponent(zoneId)}?days=${days}`);
    console.log('Historical readings:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching historical readings:', error);
    return { data: [] };
  }
};

// Function to get historical readings for all zones
export const getAllZonesHistoricalReadings = async (days = 7) => {
  try {
    console.log(`Fetching historical readings for all zones over ${days} days...`);
    const response = await apiClient.get(`/readings/history/all-zones?days=${days}`);
    console.log('All zones historical data:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching all zones historical data:', error);
    return { data: {} };
  }
};

// --- ALERT FEEDBACK API ---

export const getAllFeedback = async () => {
  try {
    const response = await apiClient.get('/feedback/');
    return response;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return { data: { feedback: {} } };
  }
};

export const submitAlertFeedback = async (alertId, feedback) => {
  return apiClient.post(`/feedback/${alertId}`, { feedback });
};

// --- TASK STATUS API ---

export const getTaskStatuses = async () => {
  try {
    const response = await apiClient.get('/tasks/statuses');
    return response;
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    return { data: { statuses: {} } };
  }
};

export const updateTaskStatus = async (alertId, status) => {
  return apiClient.patch(`/tasks/${alertId}/status`, { status });
};

export const resetTaskStatus = async (alertId) => {
  return apiClient.delete(`/tasks/${alertId}/status`);
};

// Function to get daily average temperatures for degree days calculation (Harvest Prediction)
export const getDailyAverageTemperatures = async (zoneId, days = 180) => {
  try {
    console.log(`Fetching daily averages for ${zoneId}...`);
    const response = await apiClient.get(`/readings/history/${encodeURIComponent(zoneId)}/daily-average?days=${days}`);
    console.log(`✅ Daily averages for ${zoneId}:`, response.data?.length || 0, 'days');
    return response;
  } catch (error) {
    console.error(`❌ Error fetching temperature data for ${zoneId}:`, error);
    console.error(`Error details:`, error.response?.data || error.message);
    return { data: [] };
  }
};