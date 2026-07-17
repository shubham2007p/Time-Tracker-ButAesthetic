/**
 * Utility functions for Time Canvas
 */

/**
 * Checks if a year is a leap year.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Gets the number of days in a specific month of a year.
 * @param {number} year
 * @param {number} month (0-indexed, 0 = January)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculates the day of the year (1-365 or 1-366).
 * @param {Date} date
 * @returns {number}
 */
export function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculates the hour of the week (0-167), starting Monday 00:00.
 * @param {Date} date
 * @returns {number}
 */
export function getHourOfWeek(date) {
  // Convert so Monday is 0, Sunday is 6
  const day = (date.getDay() + 6) % 7;
  return day * 24 + date.getHours();
}

/**
 * Calculates the percentage of the Day that has elapsed.
 * @param {Date} date
 * @returns {number}
 */
export function getDayPercentage(date) {
  const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (24 * 3600)) * 100;
}

/**
 * Calculates the percentage of the Week that has elapsed.
 * @param {Date} date
 * @returns {number}
 */
export function getWeekPercentage(date) {
  const seconds = getHourOfWeek(date) * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (168 * 3600)) * 100;
}

/**
 * Calculates the percentage of the Month that has elapsed.
 * @param {Date} date
 * @returns {number}
 */
export function getMonthPercentage(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const seconds = (date.getDate() - 1) * 24 * 3600 + date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (daysInMonth * 24 * 3600)) * 100;
}

/**
 * Calculates the percentage of the Year that has elapsed.
 * @param {Date} date
 * @returns {number}
 */
export function getYearPercentage(date) {
  const year = date.getFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;
  const seconds = (getDayOfYear(date) - 1) * 24 * 3600 + date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (totalDays * 24 * 3600)) * 100;
}

/**
 * Formats header components: Day name & Date string.
 * @param {Date} date
 * @returns {{dayName: string, dateString: string}}
 */
export function formatHeader(date) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    dayName: dayNames[date.getDay()],
    dateString: `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
  };
}
