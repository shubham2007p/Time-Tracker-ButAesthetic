import { DotRenderer } from './renderer.js';
import { getHourOfWeek, getWeekPercentage } from './utils.js';

export function renderWeekView(container, date) {
  const currentHourOfWeek = getHourOfWeek(date);
  const dots = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let h = 0; h < 168; h++) {
    let status = 'future';
    let statusText = 'Future hour';
    
    if (h < currentHourOfWeek) {
      status = 'completed';
      statusText = 'Completed hour';
    } else if (h === currentHourOfWeek) {
      status = 'current';
      statusText = 'Current hour';
    }
    
    const dayIndex = Math.floor(h / 24);
    const hourOfDay = h % 24;
    const displayHour = hourOfDay === 0 ? '12 AM' : hourOfDay === 12 ? '12 PM' : hourOfDay > 12 ? `${hourOfDay - 12} PM` : `${hourOfDay} AM`;
    const label = `${dayNames[dayIndex]} ${displayHour}: ${statusText}`;
    
    dots.push({
      id: h,
      status,
      label
    });
  }

  if (container.className !== 'grid-container week-grid') {
    container.className = 'grid-container week-grid';
  }
  
  DotRenderer.render(container, dots);

  const percentage = getWeekPercentage(date);
  const daysPassed = (date.getDay() + 6) % 7;

  const stats = [
    { label: 'Hours Passed', value: currentHourOfWeek },
    { label: 'Hours Remaining', value: 168 - currentHourOfWeek },
    { label: 'Days Passed', value: daysPassed },
    { label: 'Days Remaining', value: 6 - daysPassed }
  ];

  return { percentage, stats };
}
