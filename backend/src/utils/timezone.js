const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Vietnam timezone
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Convert UTC date to Vietnam timezone
 * @param {Date|string} date - UTC date to convert
 * @returns {Date} Date in Vietnam timezone
 */
function toVietnamTime(date) {
  if (!date) return null;
  return dayjs(date).tz(VIETNAM_TIMEZONE).toDate();
}

/**
 * Convert UTC date to Vietnam timezone string
 * @param {Date|string} date - UTC date to convert
 * @param {string} format - Output format (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} Formatted date string in Vietnam timezone
 */
function toVietnamTimeString(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return null;
  return dayjs(date).tz(VIETNAM_TIMEZONE).format(format);
}

/**
 * Get current date in Vietnam timezone
 * @returns {Date} Current date in Vietnam timezone
 */
function getCurrentVietnamTime() {
  return dayjs().tz(VIETNAM_TIMEZONE).toDate();
}

/**
 * Convert Vietnam timezone date to UTC
 * @param {Date|string} date - Date in Vietnam timezone
 * @returns {Date} Date in UTC
 */
function toUTC(date) {
  if (!date) return null;
  return dayjs(date).tz(VIETNAM_TIMEZONE).utc().toDate();
}

/**
 * Get start of day in Vietnam timezone
 * @param {Date|string} date - Date to get start of day for
 * @returns {Date} Start of day in Vietnam timezone
 */
function startOfDayVietnam(date) {
  if (!date) return null;
  return dayjs(date).tz(VIETNAM_TIMEZONE).startOf('day').toDate();
}

/**
 * Get end of day in Vietnam timezone
 * @param {Date|string} date - Date to get end of day for
 * @returns {Date} End of day in Vietnam timezone
 */
function endOfDayVietnam(date) {
  if (!date) return null;
  return dayjs(date).tz(VIETNAM_TIMEZONE).endOf('day').toDate();
}

/**
 * Get date range for a specific day in Vietnam timezone
 * @param {Date|string} date - Date to get range for
 * @returns {Object} Object with start and end of day in Vietnam timezone
 */
function getDayRangeVietnam(date) {
  if (!date) return { start: null, end: null };
  const vietnamDate = dayjs(date).tz(VIETNAM_TIMEZONE);
  return {
    start: vietnamDate.startOf('day').toDate(),
    end: vietnamDate.endOf('day').toDate()
  };
}

/**
 * Mongoose transform function to convert timestamps to Vietnam timezone
 * @param {Object} doc - Mongoose document
 * @param {Object} ret - Document to be returned
 * @returns {Object} Transformed document
 */
function transformTimestamps(doc, ret) {
  // Convert timestamps to Vietnam timezone
  if (ret.createdAt) {
    ret.createdAt = toVietnamTime(ret.createdAt);
  }
  if (ret.updatedAt) {
    ret.updatedAt = toVietnamTime(ret.updatedAt);
  }
  
  // Convert other date fields if they exist
  if (ret.capturedAt) {
    ret.capturedAt = toVietnamTime(ret.capturedAt);
  }
  
  return ret;
}

module.exports = {
  VIETNAM_TIMEZONE,
  toVietnamTime,
  toVietnamTimeString,
  getCurrentVietnamTime,
  toUTC,
  startOfDayVietnam,
  endOfDayVietnam,
  getDayRangeVietnam,
  transformTimestamps
};
