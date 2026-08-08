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
    if (container.className !== 'grid-container month-hours-grid') {
      container.className = 'grid-container month-hours-grid';
      container.innerHTML = '';
    }

    const existingCells = container.children;
    if (existingCells.length !== totalDays) {
      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let d = 1; d <= totalDays; d++) {
        const cell = document.createElement('div');
        cell.className = 'day-hours-cell';
        for (let h = 0; h < 24; h++) {
          const dot = document.createElement('div');
          dot.className = 'dot';
          cell.appendChild(dot);
        }
        fragment.appendChild(cell);
      }
      container.appendChild(fragment);
    }

    // Diff and update hourly dots inside cells
    for (let d = 1; d <= totalDays; d++) {
      const cell = existingCells[d - 1];
      const dots = cell.children;
      const isPastDay = d < currentDay;
      const isToday = d === currentDay;

      for (let h = 0; h < 24; h++) {
        const dot = dots[h];
        let targetClass = 'dot';
        
        if (isPastDay || (isToday && h < currentHour)) {
          targetClass = 'dot completed';
        } else if (isToday && h === currentHour) {
          targetClass = 'dot current';
        }

        if (dot.className !== targetClass) {
          dot.className = targetClass;
        }

        const label = `${monthNames[month]} ${d}, hour ${h}: ${isPastDay || (isToday && h < currentHour) ? 'Completed' : (isToday && h === currentHour) ? 'Current' : 'Future'}`;
        if (dot.getAttribute('aria-label') !== label) {
          dot.setAttribute('aria-label', label);
        }
      }
    }
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
