import { isLeapYear, getDayOfYear, getDaysInMonth, getYearPercentage } from './utils.js';

export function renderYearView(container, date, mode = 'days') {
  const year = date.getFullYear();
  const currentDayOfYear = getDayOfYear(date);
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const currentHour = date.getHours();
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totalDays = isLeapYear(year) ? 366 : 365;

  // 1. Ensure year wrapper structure
  const containerClass = mode === 'hours' ? 'year-months-container year-hours-mode' : 'year-months-container';
  if (container.className !== containerClass) {
    container.className = containerClass;
    container.innerHTML = '';
  }

  const existingMonthCards = container.children;
  if (existingMonthCards.length !== 12) {
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    for (let m = 0; m < 12; m++) {
      const card = document.createElement('div');
      card.className = 'year-month-card';
      
      const title = document.createElement('div');
      title.className = 'year-month-title';
      title.textContent = monthNames[m];
      card.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = mode === 'hours' ? 'year-month-hours-grid' : 'year-month-days-grid';
      card.appendChild(grid);
      
      fragment.appendChild(card);
    }
    container.appendChild(fragment);
  }

  // 2. Render / Diff each month's contents
  for (let m = 0; m < 12; m++) {
    const card = existingMonthCards[m];
    const grid = card.querySelector(mode === 'hours' ? '.year-month-hours-grid' : '.year-month-days-grid');
    
    // If layout mode changed on grid child, recreate grid contents
    if (!grid) {
      const oldGrid = card.children[1];
      if (oldGrid) card.removeChild(oldGrid);
      
      const newGrid = document.createElement('div');
      newGrid.className = mode === 'hours' ? 'year-month-hours-grid' : 'year-month-days-grid';
      card.appendChild(newGrid);
      continue;
    }

    const daysInMonth = getDaysInMonth(year, m);

    if (mode === 'hours') {
      const existingCells = grid.children;
      if (existingCells.length !== daysInMonth) {
        grid.innerHTML = '';
        const gridFragment = document.createDocumentFragment();
        for (let d = 1; d <= daysInMonth; d++) {
          const cell = document.createElement('div');
          cell.className = 'day-hours-cell';
          for (let h = 0; h < 24; h++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            cell.appendChild(dot);
          }
          gridFragment.appendChild(cell);
        }
        grid.appendChild(gridFragment);
      }

      // Diff hours
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = existingCells[d - 1];
        const dots = cell.children;
        const isPastDay = m < currentMonth || (m === currentMonth && d < currentDay);
        const isToday = m === currentMonth && d === currentDay;

        for (let h = 0; h < 24; h++) {
          const dot = dots[h];
          let targetStatus = 'dot';
          
          if (isPastDay || (isToday && h < currentHour)) {
            targetStatus = 'dot completed';
          } else if (isToday && h === currentHour) {
            targetStatus = 'dot current';
          }
          
          if (dot.className !== targetStatus) {
            dot.className = targetStatus;
          }
          
          const label = `${monthNames[m]} ${d}, hour ${h}: ${isPastDay || (isToday && h < currentHour) ? 'Completed' : (isToday && h === currentHour) ? 'Current' : 'Future'}`;
          if (dot.getAttribute('aria-label') !== label) {
            dot.setAttribute('aria-label', label);
          }
        }
      }
    } else {
      // Days mode
      const existingDots = grid.children;
      if (existingDots.length !== daysInMonth) {
        grid.innerHTML = '';
        const gridFragment = document.createDocumentFragment();
        for (let d = 1; d <= daysInMonth; d++) {
          const dot = document.createElement('div');
          dot.className = 'dot';
          gridFragment.appendChild(dot);
        }
        grid.appendChild(gridFragment);
      }

      // Diff days
      for (let d = 1; d <= daysInMonth; d++) {
        const dot = existingDots[d - 1];
        let targetStatus = 'dot';
        
        if (m < currentMonth || (m === currentMonth && d < currentDay)) {
          targetStatus = 'dot completed';
        } else if (m === currentMonth && d === currentDay) {
          targetStatus = 'dot current';
        }

        if (dot.className !== targetStatus) {
          dot.className = targetStatus;
        }

        const label = `${monthNames[m]} ${d}: ${m < currentMonth || (m === currentMonth && d < currentDay) ? 'Completed day' : (m === currentMonth && d === currentDay) ? 'Today' : 'Future day'}`;
        if (dot.getAttribute('aria-label') !== label) {
          dot.setAttribute('aria-label', label);
        }
      }
    }
  }

  const percentage = getYearPercentage(date);
  const daysPassed = currentDayOfYear - 1;
  const daysRemaining = totalDays - currentDayOfYear;
  const hoursPassed = daysPassed * 24 + currentHour;
  const hoursRemaining = daysRemaining * 24 + (24 - currentHour);
  const weeksPassed = Math.floor(daysPassed / 7);
  const weeksRemaining = Math.floor(daysRemaining / 7);

  const stats = [
    { label: 'Days Passed', value: daysPassed },
    { label: 'Days Remaining', value: daysRemaining },
    { label: 'Hours Passed', value: hoursPassed },
    { label: 'Hours Remaining', value: hoursRemaining },
    { label: 'Weeks Passed', value: weeksPassed },
    { label: 'Weeks Remaining', value: weeksRemaining }
  ];

  return { percentage, stats };
}
