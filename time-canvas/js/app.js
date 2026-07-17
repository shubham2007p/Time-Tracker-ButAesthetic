import { ThemeManager } from './theme.js';
import { TimeCoordinator } from './time.js';
import { Router } from './router.js';
import { formatHeader, getHourOfWeek } from './utils.js';
import { DotRenderer } from './renderer.js';

import { renderDayView } from './day.js';
import { renderWeekView } from './week.js';
import { renderMonthView } from './month.js';
import { renderYearView } from './year.js';

document.addEventListener('DOMContentLoaded', () => {
  const themeManager = new ThemeManager();
  const timeCoordinator = new TimeCoordinator();
  
  const container = document.getElementById('grid-container');
  const dayHeader = document.getElementById('time-day');
  const dateHeader = document.getElementById('time-date');
  const themeBtn = document.getElementById('theme-btn');
  
  const progressArcFill = document.getElementById('progress-arc-fill');
  const arcPercentage = document.getElementById('arc-percentage');
  const arcLabel = document.getElementById('arc-label');
  const statsContainer = document.getElementById('stats-container');
  
  const modeSwitchContainer = document.getElementById('mode-switch-container');
  const modeDaysBtn = document.getElementById('mode-days');
  const modeHoursBtn = document.getElementById('mode-hours');
  
  let currentView = 'day';
  let currentTime = new Date();
  
  // Track modes for month and year views
  const viewModes = {
    month: 'days',
    year: 'days'
  };

  const viewRenderers = {
    day: (c, d) => renderDayView(c, d),
    week: (c, d) => renderWeekView(c, d),
    month: (c, d) => renderMonthView(c, d, viewModes.month),
    year: (c, d) => renderYearView(c, d, viewModes.year)
  };

  const arcLabels = {
    day: 'TODAY',
    week: 'THIS WEEK',
    month: 'THIS MONTH',
    year: 'THIS YEAR'
  };

  // Setup theme button cycle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.cycleTheme();
    });
  }

  // Segmented Mode Switcher event handlers
  const setDisplayMode = (mode) => {
    if (currentView !== 'month' && currentView !== 'year') return;
    
    viewModes[currentView] = mode;
    
    if (mode === 'days') {
      modeDaysBtn.classList.add('active');
      modeHoursBtn.classList.remove('active');
    } else {
      modeDaysBtn.classList.remove('active');
      modeHoursBtn.classList.add('active');
    }
    
    // Smooth transition between Days/Hours
    if (container) {
      container.classList.remove('active');
      setTimeout(() => {
        updateApp();
        container.classList.add('active');
      }, 150);
    }
  };

  if (modeDaysBtn && modeHoursBtn) {
    modeDaysBtn.addEventListener('click', () => setDisplayMode('days'));
    modeHoursBtn.addEventListener('click', () => setDisplayMode('hours'));
  }

  // Update headers, progress arc, stats, and dot grid
  const updateApp = () => {
    // 1. Headers
    const headers = formatHeader(currentTime);
    if (dayHeader) dayHeader.textContent = headers.dayName;
    if (dateHeader) dateHeader.textContent = headers.dateString;

    // 2. View Mode Switch Visibility
    if (modeSwitchContainer) {
      if (currentView === 'month' || currentView === 'year') {
        modeSwitchContainer.classList.remove('hidden');
        const activeMode = viewModes[currentView];
        if (activeMode === 'days') {
          modeDaysBtn.classList.add('active');
          modeHoursBtn.classList.remove('active');
        } else {
          modeDaysBtn.classList.remove('active');
          modeHoursBtn.classList.add('active');
        }
      } else {
        modeSwitchContainer.classList.add('hidden');
      }
    }

    // 3. Render View & Extract stats/percentage
    const renderer = viewRenderers[currentView];
    if (renderer && container) {
      const { percentage, stats } = renderer(container, currentTime);

      // 4. Progress Arc Update
      if (arcPercentage) arcPercentage.textContent = `${Math.floor(percentage)}%`;
      if (arcLabel) arcLabel.textContent = arcLabels[currentView] || '';
      if (progressArcFill) {
        DotRenderer.updateArc(progressArcFill, percentage);
      }

      // 5. Render stats list
      if (statsContainer) {
        statsContainer.innerHTML = '';
        stats.forEach(s => {
          const item = document.createElement('div');
          item.className = 'stat-item';
          
          const val = document.createElement('span');
          val.className = 'stat-val';
          val.textContent = s.value;
          
          const lbl = document.createElement('span');
          lbl.className = 'stat-lbl';
          lbl.textContent = s.label;
          
          item.appendChild(val);
          item.appendChild(lbl);
          statsContainer.appendChild(item);
        });
      }
    }
  };

  // Setup Router
  const routes = {
    day: 'day',
    week: 'week',
    month: 'month',
    year: 'year'
  };
  
  const router = new Router(routes, 'day');

  router.onChange((view) => {
    currentView = view;
    updateApp();
    
    setTimeout(() => {
      router.updateNavIndicator();
    }, 50);
  });

  // Subscribe to clock ticks
  timeCoordinator.subscribe((now) => {
    currentTime = now;
    // Utilize requestAnimationFrame for UI painting alignment
    requestAnimationFrame(updateApp);
  });

  timeCoordinator.start();

  // Accessibility keyboard navigation support
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, index) => {
    // Click navigation support
    item.addEventListener('click', () => {
      window.location.hash = `#/${item.getAttribute('data-route')}`;
    });

    item.addEventListener('keydown', (e) => {
      let nextIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (index + 1) % navItems.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (index - 1 + navItems.length) % navItems.length;
      }
      
      if (nextIndex !== null) {
        navItems[nextIndex].focus();
        window.location.hash = `#/${navItems[nextIndex].getAttribute('data-route')}`;
        e.preventDefault();
      }
    });
  });
});
