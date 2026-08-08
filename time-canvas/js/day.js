import { DotRenderer } from './renderer.js';
import { getDayPercentage } from './utils.js';

export function renderDayView(container, date) {
  const currentHour = date.getHours();
  
  // Calculate Focus Time from localStorage
  let workSessionsCount = 0;
  let workDuration = 25;
  try {
    const count = JSON.parse(localStorage.getItem('pomodoro_work_count'));
    workSessionsCount = typeof count === 'number' ? count : 0;
    const config = JSON.parse(localStorage.getItem('pomodoro_config'));
    if (config && typeof config.work === 'number') {
      workDuration = config.work;
    }
  } catch (e) {
    // keep defaults
  }

  const focusedMinutes = workSessionsCount * workDuration;
  const totalFocusHours = Math.floor(focusedMinutes / 60);
  const focusedHoursCount = Math.min(currentHour, totalFocusHours);

  const dots = [];
  for (let hour = 0; hour < 24; hour++) {
    let status = 'future';
    let statusText = 'Future hour';
    let tooltip = '';
    
    const displayHour = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

    if (hour < currentHour) {
      if (hour < focusedHoursCount) {
        status = 'focused';
        statusText = 'Focused hour';
        tooltip = `Hour: ${displayHour}\nFocused: Yes\nPomodoro Time: 60 min`;
      } else {
        status = 'completed-muted';
        statusText = 'Completed hour';
        tooltip = `Hour: ${displayHour}\nFocused: No\nPomodoro Time: 0 min`;
      }
    } else if (hour === currentHour) {
      status = 'current';
      statusText = 'Current hour';
      tooltip = `Hour: ${displayHour}\nIn Progress`;
    } else {
      tooltip = `Hour: ${displayHour}\nFuture`;
    }

    dots.push({ 
      id: hour, 
      status, 
      label: `${displayHour}: ${statusText}`,
      tooltip
    });
  }

  if (container.className !== 'grid-container day-grid') {
    container.className = 'grid-container day-grid';
  }
  DotRenderer.render(container, dots);

  // Statistics Calculations
  const percentage = getDayPercentage(date);
  const focusHoursVal = (focusedMinutes / 60).toFixed(1);
  const focusPct = currentHour > 0 ? Math.round(((focusedMinutes / 60) / currentHour) * 100) : 0;
  const dayPct = Math.round((currentHour / 24) * 100);

  const stats = [
    { label: 'Hours Passed', value: `${currentHour} / 24` },
    { label: 'Focused Hours', value: `${focusHoursVal} h` },
    { label: 'Focus %', value: `${focusPct}%` },
    { label: 'Day %', value: `${dayPct}%` }
  ];

  return { percentage, stats };
}
