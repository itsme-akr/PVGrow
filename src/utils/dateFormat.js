/**
 * Date Formatting Utilities
 * Unified date format: YYYY-MM-DD for all dates
 * Timestamp format: YYYY-MM-DD HH:MM:SS for timestamps
 * All dates are converted to Lithuania timezone (Europe/Vilnius)
 */

/**
 * Convert UTC date to Lithuania timezone (Europe/Vilnius)
 * @param {Date|string} date - Date object or ISO string (assumed to be UTC)
 * @returns {Object} Object with date components in Lithuania timezone
 */
const toLithuaniaTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  // Use Intl.DateTimeFormat to get components in Lithuania timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vilnius',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type) => {
    const part = parts.find(p => p.type === type);
    return part ? part.value : '';
  };
  
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second')
  };
};

/**
 * Format date to YYYY-MM-DD (Lithuania timezone)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date as YYYY-MM-DD
 */
export const formatDate = (date) => {
  if (!date) return '';
  const parts = toLithuaniaTime(date);
  if (!parts) return '';
  
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/**
 * Format timestamp to YYYY-MM-DD HH:MM:SS (Lithuania timezone)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted timestamp as YYYY-MM-DD HH:MM:SS
 */
export const formatTimestamp = (date) => {
  if (!date) return '';
  const parts = toLithuaniaTime(date);
  if (!parts) return '';
  
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

/**
 * Format date with time to YYYY-MM-DD, HH:MM:SS (with comma, Lithuania timezone)
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted timestamp as YYYY-MM-DD, HH:MM:SS
 */
export const formatTimestampWithComma = (date) => {
  if (!date) return '';
  const parts = toLithuaniaTime(date);
  if (!parts) return '';
  
  return `${parts.year}-${parts.month}-${parts.day}, ${parts.hour}:${parts.minute}:${parts.second}`;
};

/**
 * Format date range: YYYY-MM-DD – YYYY-MM-DD
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
};

