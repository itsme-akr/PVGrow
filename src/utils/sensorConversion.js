/**
 * Sensor Value Conversion Utilities
 * 
 * Converts raw sensor values to real-world intuitive values
 * for display in the AgriPV MVP dashboard
 */

/**
 * Convert raw sensor data to real-world values
 * @param {Object} rawData - Raw sensor data from backend
 * @returns {Object} Converted sensor data with real-world values
 */
export const convertSensorValues = (rawData) => {
  if (!rawData) return null;

  return {
    // Air temperature: Convert from raw ADC/voltage to Celsius
    air_temperature: rawData.air_temperature ? convertTemperature(rawData.air_temperature) : null,
    
    // Soil temperature: Convert using specific formula: (measured value - 0.5) / 0.01 
    soil_temperature: rawData.soil_temperature ? convertSoilTemperature(rawData.soil_temperature) : null,
    
    // Irradiance: Keep raw value as-is, already in kW/m²
    irradiance: rawData.irradiance ? convertIrradiance(rawData.irradiance) : null,
    
    // Soil moisture: Convert using specific formula: measured value / 3 * 50 (result in %)
    soil_moisture: rawData.soil_moisture ? convertSoilMoisture(rawData.soil_moisture) : null,
    
    // Keep original metadata
    zone_id: rawData.zone_id,
    timestamp: rawData.timestamp
  };
};

/**
 * Convert raw temperature value to Celsius
 * @param {number} rawValue - Raw temperature sensor value
 * @returns {number} Temperature in Celsius
 */
const convertTemperature = (rawValue) => {
  // Air temperature - assume already in Celsius if reasonable range
  if (rawValue >= -40 && rawValue <= 85) {
    return rawValue;
  }
  
  // If raw ADC value, convert using generic formula
  if (rawValue > 100) {
    const voltage = (rawValue * 3.3) / 4096;
    return (voltage - 0.5) / 0.01;
  }
  
  return rawValue;
};

/**
 * Convert raw soil temperature value to Celsius.
 *
 * In production, sensor data will come as raw readings (e.g. voltage),
 * but current databases may already contain values in °C.
 *
 * Strategy:
 * - If value is within a realistic Celsius range (-20°C to 60°C), assume it's already °C.
 * - Otherwise, treat it as a raw measurement and apply the provided formula:
 *   (measured value - 0.5) / 0.01
 *
 * @param {number} rawValue - Raw soil temperature sensor value
 * @returns {number} Soil temperature in Celsius
 */
const convertSoilTemperature = (rawValue) => {
  // If value is already in a plausible Celsius range, return as-is
  if (rawValue >= -20 && rawValue <= 60) {
    return rawValue;
  }

  // Apply the specific formula for raw measurements: (measured value - 0.5) / 0.01
  return (rawValue - 0.5) / 0.01;
};

/**
 * Convert raw irradiance value - keep as kW/m² (no conversion needed)
 * @param {number} rawValue - Raw irradiance sensor value in kW/m²
 * @returns {number} Irradiance in kW/m² (unchanged)
 */
const convertIrradiance = (rawValue) => {
  // No conversion needed - irradiance is already in kW/m² as specified
  return rawValue;
};

/**
 * Convert raw soil moisture value to percentage.
 *
 * In production, sensor data will be raw electrical readings, but existing
 * databases may already contain values in %.
 *
 * Strategy:
 * - If value is in [0, 100], assume it's already a percentage.
 * - Otherwise, apply the provided formula: measured value / 3 * 50.
 *
 * @param {number} rawValue - Raw soil moisture sensor value
 * @returns {number} Soil moisture percentage (0-100%)
 */
const convertSoilMoisture = (rawValue) => {
  // If value looks like a percentage already, keep it
  if (rawValue >= 0 && rawValue <= 100) {
    return rawValue;
  }

  // Apply the specific formula provided: measured value / 3 * 50
  const percentage = (rawValue / 3) * 50;

  // Clamp to 0-100 range for safety
  return Math.max(0, Math.min(100, percentage));
};

/**
 * Format sensor value for display with proper decimal places
 * @param {number} value - Sensor value
 * @param {string} type - Sensor type ('temperature', 'irradiance', 'moisture')
 * @returns {string} Formatted value
 */
export const formatSensorValue = (value, type) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'temperature':
      return value.toFixed(1); // 1 decimal place for temperatures
    case 'irradiance':
      return value.toFixed(3); // 3 decimal places for kW/m² (since values are small like 0.011)
    case 'moisture':
      return value.toFixed(1); // 1 decimal place for moisture
    default:
      return value.toFixed(1);
  }
};
