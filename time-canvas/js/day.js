import { DotRenderer } from './renderer.js';
import { getDayPercentage } from './utils.js';

export function renderDayView(container, date) {
  const currentHour = date.getHours();
  const dots = [];

  for (let hour = 0; hour < 24; hour++) {
    let status = 'future';
    let statusText = 'Future hour';
    
    if (hour < currentHour) {
      status = 'completed';
      statusText = 'Completed hour';
    } else if (hour === currentHour) {
      status = 'current';
      statusText = 'Current hour';
    }
    
    const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    
    dots.push({
      id: hour,
      status,
      label: `${displayHour}: ${statusText}`
    });
  }

  if (container.className !== 'grid-container day-grid') {
    container.className = 'grid-container day-grid';
  }
  
  DotRenderer.render(container, dots);

  const percentage = getDayPercentage(date);
  
  const stats = [
    { label: 'Hours Passed', value: currentHour },
    { label: 'Hours Remaining', value: 24 - currentHour },
    { label: 'Percentage Complete', value: `${Math.floor(percentage)}%` }
  ];

  return { percentage, stats };
}
