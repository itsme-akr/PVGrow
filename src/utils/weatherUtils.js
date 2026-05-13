/**
 * Weather Utility Functions
 * 
 * Helper functions for weather data processing and display
 */

import { formatDate as formatDateStandard } from './dateFormat.js';

/**
 * Convert WMO weather code to human-readable description and icon
 * @param {number} code - WMO weather code
 * @returns {object} Weather description and icon
 */
export const getWeatherInfo = (code) => {
  const weatherCodes = {
    0: { description: 'Clear sky', icon: '☀️', color: '#FFD700' },
    1: { description: 'Mainly clear', icon: '🌤️', color: '#FFA500' },
    2: { description: 'Partly cloudy', icon: '⛅', color: '#87CEEB' },
    3: { description: 'Overcast', icon: '☁️', color: '#708090' },
    45: { description: 'Fog', icon: '🌫️', color: '#696969' },
    48: { description: 'Depositing rime fog', icon: '🌫️', color: '#696969' },
    51: { description: 'Light drizzle', icon: '🌦️', color: '#4682B4' },
    53: { description: 'Moderate drizzle', icon: '🌧️', color: '#4169E1' },
    55: { description: 'Dense drizzle', icon: '🌧️', color: '#0000CD' },
    56: { description: 'Light freezing drizzle', icon: '🌨️', color: '#6495ED' },
    57: { description: 'Dense freezing drizzle', icon: '🌨️', color: '#4169E1' },
    61: { description: 'Slight rain', icon: '🌦️', color: '#4682B4' },
    63: { description: 'Moderate rain', icon: '🌧️', color: '#4169E1' },
    65: { description: 'Heavy rain', icon: '⛈️', color: '#0000CD' },
    66: { description: 'Light freezing rain', icon: '🌨️', color: '#6495ED' },
    67: { description: 'Heavy freezing rain', icon: '🌨️', color: '#4169E1' },
    71: { description: 'Slight snow fall', icon: '🌨️', color: '#87CEEB' },
    73: { description: 'Moderate snow fall', icon: '❄️', color: '#6495ED' },
    75: { description: 'Heavy snow fall', icon: '❄️', color: '#4169E1' },
    77: { description: 'Snow grains', icon: '🌨️', color: '#87CEEB' },
    80: { description: 'Slight rain showers', icon: '🌦️', color: '#4682B4' },
    81: { description: 'Moderate rain showers', icon: '🌧️', color: '#4169E1' },
    82: { description: 'Violent rain showers', icon: '⛈️', color: '#0000CD' },
    85: { description: 'Slight snow showers', icon: '🌨️', color: '#87CEEB' },
    86: { description: 'Heavy snow showers', icon: '❄️', color: '#4169E1' },
    95: { description: 'Thunderstorm', icon: '⛈️', color: '#8B0000' },
    96: { description: 'Thunderstorm with slight hail', icon: '⛈️', color: '#8B0000' },
    99: { description: 'Thunderstorm with heavy hail', icon: '⛈️', color: '#8B0000' }
  };

  return weatherCodes[code] || { 
    description: 'Unknown', 
    icon: '❓', 
    color: '#808080' 
  };
};

/**
 * Format temperature for display
 * @param {number} temp - Temperature in Celsius
 * @returns {string} Formatted temperature
 */
export const formatTemperature = (temp) => {
  if (temp === null || temp === undefined) return 'N/A';
  return `${Math.round(temp)}°C`;
};

/**
 * Format humidity for display
 * @param {number} humidity - Humidity percentage
 * @returns {string} Formatted humidity
 */
export const formatHumidity = (humidity) => {
  if (humidity === null || humidity === undefined) return 'N/A';
  return `${Math.round(humidity)}%`;
};

/**
 * Format precipitation for display
 * @param {number} precipitation - Precipitation in mm
 * @returns {string} Formatted precipitation
 */
export const formatPrecipitation = (precipitation) => {
  if (precipitation === null || precipitation === undefined) return 'N/A';
  if (precipitation === 0) return '0mm';
  if (precipitation < 0.1) return '<0.1mm';
  return `${precipitation.toFixed(1)}mm`;
};

/**
 * Format wind speed for display
 * @param {number} windSpeed - Wind speed in km/h
 * @returns {string} Formatted wind speed
 */
export const formatWindSpeed = (windSpeed) => {
  if (windSpeed === null || windSpeed === undefined) return 'N/A';
  return `${Math.round(windSpeed)} km/h`;
};

/**
 * Format pressure for display
 * @param {number} pressure - Pressure in hPa
 * @returns {string} Formatted pressure
 */
export const formatPressure = (pressure) => {
  if (pressure === null || pressure === undefined) return 'N/A';
  return `${Math.round(pressure)} hPa`;
};

/**
 * Format UV index for display with risk level
 * @param {number} uvIndex - UV index
 * @returns {object} Formatted UV index with risk level and color
 */
export const formatUVIndex = (uvIndex) => {
  if (uvIndex === null || uvIndex === undefined) {
    return { text: 'N/A', risk: 'Unknown', color: '#808080' };
  }

  const uv = Math.round(uvIndex * 10) / 10; // Round to 1 decimal
  
  if (uv <= 2) return { text: uv.toString(), risk: 'Low', color: '#00FF00' };
  if (uv <= 5) return { text: uv.toString(), risk: 'Moderate', color: '#FFFF00' };
  if (uv <= 7) return { text: uv.toString(), risk: 'High', color: '#FF8C00' };
  if (uv <= 10) return { text: uv.toString(), risk: 'Very High', color: '#FF0000' };
  return { text: uv.toString(), risk: 'Extreme', color: '#8B00FF' };
};

/**
 * Get agricultural advice based on weather conditions
 * @param {object} weatherData - Current weather data
 * @returns {array} Array of advice strings
 */
export const getAgriculturalAdvice = (weatherData) => {
  const advice = [];
  
  if (!weatherData) return advice;

  // Temperature advice
  if (weatherData.temperature < 0) {
    advice.push('🥶 Frost risk - protect sensitive plants');
  } else if (weatherData.temperature > 30) {
    advice.push('🌡️ Heat stress risk - ensure adequate irrigation');
  }

  // Humidity advice
  if (weatherData.humidity > 90) {
    advice.push('💧 High humidity - monitor for fungal diseases');
  } else if (weatherData.humidity < 40) {
    advice.push('🏜️ Low humidity - plants may need extra water');
  }

  // Precipitation advice
  if (weatherData.precipitation > 10) {
    advice.push('🌧️ Heavy rain expected - delay spraying operations');
  } else if (weatherData.precipitation > 0) {
    advice.push('🌦️ Light rain - good for natural irrigation');
  }

  // Wind advice
  if (weatherData.wind_speed > 20) {
    advice.push('💨 Strong winds - avoid spraying, secure equipment');
  }

  // UV advice
  const uvInfo = formatUVIndex(weatherData.uv_index);
  if (uvInfo.risk === 'High' || uvInfo.risk === 'Very High') {
    advice.push('☀️ High UV - ideal conditions for pest control spraying');
  }

  return advice;
};

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Invalid time';
  }
};

/**
 * Format date for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  // Use centralized date formatting (YYYY-MM-DD format)
  return formatDateStandard(timestamp) || 'Invalid date';
};





