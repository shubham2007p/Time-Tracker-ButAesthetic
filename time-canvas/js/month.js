import { DotRenderer } from './renderer.js';
import { getDaysInMonth, getMonthPercentage } from './utils.js';

export function renderMonthView(container, date, mode = 'days') {
  const year = date.getFullYear();
  const month = date.getMonth();
  const currentDay = date.getDate();
  const currentHour = date.getHours();
  const totalDays = getDaysInMonth(year, month);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (mode === 'hours') {
    // Mode Hours: 24 dots for every day
    const groups = [];
    
    for (let d = 1; d <= totalDays; d++) {
      const dayDots = [];
      const isPastDay = d < currentDay;
      const isToday = d === currentDay;
      
      for (let h = 0; h < 24; h++) {
        let status = 'future';
        let statusText = 'Future hour';
        
        if (isPastDay || (isToday && h < currentHour)) {
          status = 'completed';
          statusText = 'Completed hour';
        } else if (isToday && h === currentHour) {
          status = 'current';
          statusText = 'Current hour';
        }
        
        const displayHour = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
        dayDots.push({
          status,
          label: `${monthNames[month]} ${d}, ${displayHour}: ${statusText}`
        });
      }
      
      groups.push({
        id: d,
        title: `${d}`,
        dots: dayDots
      });
    }
    
    DotRenderer.renderGrouped(container, groups, 'grid-container month-hours-grid', 'day-hours-cell', 'day-hours-grid');
  } else {
    // Mode Days (default)
    const dots = [];
    
    for (let d = 1; d <= totalDays; d++) {
      let status = 'future';
      let statusText = 'Future day';
      
      if (d < currentDay) {
        status = 'completed';
        statusText = 'Completed day';
      } else if (d === currentDay) {
        status = 'current';
        statusText = 'Today';
      }
      
      dots.push({
        id: d,
        status,
        label: `${monthNames[month]} ${d}: ${statusText}`
      });
    }
    
    if (container.className !== 'grid-container month-grid') {
      container.className = 'grid-container month-grid';
    }
    DotRenderer.render(container, dots);
  }

  const percentage = getMonthPercentage(date);
  const daysPassed = currentDay - 1;
  const daysRemaining = totalDays - currentDay;
  const hoursPassed = daysPassed * 24 + currentHour;
  const hoursRemaining = daysRemaining * 24 + (24 - currentHour);

  const stats = [
    { label: 'Days Passed', value: daysPassed },
    { label: 'Days Remaining', value: daysRemaining },
    { label: 'Hours Passed', value: hoursPassed },
    { label: 'Hours Remaining', value: hoursRemaining }
  ];

  return { percentage, stats };
}
