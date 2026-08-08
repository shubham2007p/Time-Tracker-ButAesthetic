/**
 * Time Canvas - Monolithic Application Bundle
 * Combined to eliminate cross-origin ES module blockages.
 */

// ==========================================
// 1. UTILS
// ==========================================
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getHourOfWeek(date) {
  const day = (date.getDay() + 6) % 7;
  return day * 24 + date.getHours();
}

function getDayPercentage(date) {
  const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (24 * 3600)) * 100;
}

function getWeekPercentage(date) {
  const seconds = getHourOfWeek(date) * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (168 * 3600)) * 100;
}

function getMonthPercentage(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const seconds = (date.getDate() - 1) * 24 * 3600 + date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (daysInMonth * 24 * 3600)) * 100;
}

function getYearPercentage(date) {
  const year = date.getFullYear();
  const totalDays = isLeapYear(year) ? 366 : 365;
  const seconds = (getDayOfYear(date) - 1) * 24 * 3600 + date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (seconds / (totalDays * 24 * 3600)) * 100;
}

function formatHeader(date) {
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

// ==========================================
// 2. THEME MANAGER
// ==========================================
class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'system'];
    this.currentTheme = localStorage.getItem('theme') || 'system';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  init() {
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });
    this.applyTheme();
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (!this.themes.includes(theme)) return;
    this.currentTheme = theme;
    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
    this.applyTheme();
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: this.currentTheme } }));
  }

  cycleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex]);
  }

  applyTheme() {
    let resolvedTheme = this.currentTheme;
    if (this.currentTheme === 'system') {
      resolvedTheme = this.mediaQuery.matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', `Current theme: ${this.currentTheme}. Click to change.`);
      themeBtn.setAttribute('data-current-theme', this.currentTheme);
    }
  }
}

// ==========================================
// 3. TIME COORDINATOR
// ==========================================
class TimeCoordinator {
  constructor() {
    this.listeners = new Set();
    this.lastTime = new Date();
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(new Date(), {
      minuteChanged: true,
      hourChanged: true,
      dayChanged: true,
      monthChanged: true,
      yearChanged: true
    });
    return () => this.listeners.delete(callback);
  }

  tick() {
    const now = new Date();
    const minuteChanged = now.getMinutes() !== this.lastTime.getMinutes();
    const hourChanged = now.getHours() !== this.lastTime.getHours();
    const dayChanged = now.getDate() !== this.lastTime.getDate();
    const monthChanged = now.getMonth() !== this.lastTime.getMonth();
    const yearChanged = now.getFullYear() !== this.lastTime.getFullYear();
    
    if (minuteChanged || hourChanged || dayChanged || monthChanged || yearChanged) {
      this.listeners.forEach(callback => {
        callback(now, { minuteChanged, hourChanged, dayChanged, monthChanged, yearChanged });
      });
      this.lastTime = now;
    }
  }
}

// ==========================================
// 4. APP STATE MANAGER
// ==========================================
class StateManager {
  constructor() {
    const initialView = window.location.hash.replace(/^#\/?/, '') || 'day';
    this.state = {
      currentView: ['day', 'week', 'month', 'year'].includes(initialView) ? initialView : 'day',
      monthMode: localStorage.getItem('month_mode') || 'days',
      yearMode: localStorage.getItem('year_mode') || 'days',
      selectedTaskId: localStorage.getItem('focus_selected_task_id') || null,
      theme: localStorage.getItem('theme') || 'system',
      panelOpen: false
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };

    if (updates.monthMode !== undefined) {
      localStorage.setItem('month_mode', this.state.monthMode);
    }
    if (updates.yearMode !== undefined) {
      localStorage.setItem('year_mode', this.state.yearMode);
    }
    if (updates.selectedTaskId !== undefined) {
      if (this.state.selectedTaskId) {
        localStorage.setItem('focus_selected_task_id', this.state.selectedTaskId);
      } else {
        localStorage.removeItem('focus_selected_task_id');
      }
    }
    if (updates.theme !== undefined) {
      if (this.state.theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', this.state.theme);
      }
    }

    let hasChanged = false;
    for (const key in updates) {
      if (prevState[key] !== this.state[key]) {
        hasChanged = true;
        break;
      }
    }
    if (hasChanged) {
      this.listeners.forEach(cb => cb(this.state, prevState));
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.state, this.state);
    return () => this.listeners.delete(callback);
  }
}

const appState = new StateManager();

// ==========================================
// 5. DOT RENDERER
// ==========================================
class DotRenderer {
  static render(container, dotStates) {
    const existingDots = container.children;
    const requiredCount = dotStates.length;
    
    if (existingDots.length > 0 && (existingDots[0].classList.contains('year-month-card') || existingDots[0].classList.contains('day-hours-cell'))) {
      container.innerHTML = '';
    }

    if (existingDots.length !== requiredCount) {
      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < requiredCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        fragment.appendChild(dot);
      }
      container.appendChild(fragment);
    }
    
    for (let i = 0; i < requiredCount; i++) {
      const dotElement = existingDots[i];
      const state = dotStates[i];
      
      let targetClass = 'dot';
      if (state.status === 'completed') {
        targetClass = 'dot completed';
      } else if (state.status === 'completed-muted') {
        targetClass = 'dot completed-muted';
      } else if (state.status === 'focused') {
        targetClass = 'dot focused';
      } else if (state.status === 'current') {
        targetClass = 'dot current';
      }
      
      if (dotElement.className !== targetClass) {
        dotElement.className = targetClass;
      }

      if (state.tooltip) {
        if (dotElement.getAttribute('title') !== state.tooltip) {
          dotElement.setAttribute('title', state.tooltip);
        }
      } else {
        dotElement.removeAttribute('title');
      }
      if (dotElement.getAttribute('aria-label') !== state.label) {
        dotElement.setAttribute('aria-label', state.label);
      }
      if (dotElement.getAttribute('role') !== 'img') {
        dotElement.setAttribute('role', 'img');
      }
    }
  }

  static updateArc(pathElement, percentage, totalLength = 251.327) {
    if (!pathElement) return;
    const offset = totalLength - (percentage / 100) * totalLength;
    pathElement.style.strokeDashoffset = offset;
  }
}

// ==========================================
// 6. VIEW RENDERERS
// ==========================================
function renderDayView(container, date) {
  const currentHour = date.getHours();
  
  // 1. Calculate Focus Time from localStorage
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

  // 2. Statistics Calculations
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

function renderWeekView(container, date) {
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
    dots.push({ id: h, status, label: `${dayNames[dayIndex]} ${displayHour}: ${statusText}` });
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

function renderMonthView(container, date, mode = 'days') {
  const year = date.getFullYear();
  const month = date.getMonth();
  const currentDay = date.getDate();
  const currentHour = date.getHours();
  const totalDays = getDaysInMonth(year, month);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (mode === 'hours') {
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
      dots.push({ id: d, status, label: `${monthNames[month]} ${d}: ${statusText}` });
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

function renderYearView(container, date, mode = 'days') {
  const year = date.getFullYear();
  const currentDayOfYear = getDayOfYear(date);
  const currentMonth = date.getMonth();
  const currentDay = date.getDate();
  const currentHour = date.getHours();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totalDays = isLeapYear(year) ? 366 : 365;

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

  for (let m = 0; m < 12; m++) {
    const card = existingMonthCards[m];
    const grid = card.querySelector(mode === 'hours' ? '.year-month-hours-grid' : '.year-month-days-grid');
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
          if (dot.className !== targetStatus) dot.className = targetStatus;
        }
      }
    } else {
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
      for (let d = 1; d <= daysInMonth; d++) {
        const dot = existingDots[d - 1];
        let targetStatus = 'dot';
        if (m < currentMonth || (m === currentMonth && d < currentDay)) {
          targetStatus = 'dot completed';
        } else if (m === currentMonth && d === currentDay) {
          targetStatus = 'dot current';
        }
        if (dot.className !== targetStatus) dot.className = targetStatus;
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

// ==========================================
// 7. TODO MANAGER
// ==========================================
class TodoManager {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    try {
      const stored = JSON.parse(localStorage.getItem('focus_tasks'));
      this.tasks = Array.isArray(stored) ? stored : [];
    } catch (e) {
      this.tasks = [];
    }
    this.selectedTaskId = localStorage.getItem('focus_selected_task_id') || null;
    if (this.selectedTaskId && this.tasks.some && !this.tasks.some(t => t.id === this.selectedTaskId)) {
      this.selectedTaskId = null;
    }
  }

  save() {
    localStorage.setItem('focus_tasks', JSON.stringify(this.tasks));
    if (this.selectedTaskId) {
      localStorage.setItem('focus_selected_task_id', this.selectedTaskId);
    } else {
      localStorage.removeItem('focus_selected_task_id');
    }
    if (this.onUpdate) this.onUpdate();
  }

  addTask(title) {
    if (!title.trim()) return;
    const task = {
      id: 'task_' + Date.now(),
      title: title.trim(),
      estPoms: 1,
      completedPoms: 0,
      completed: false,
      createdAt: Date.now()
    };
    this.tasks.push(task);
    if (!this.selectedTaskId) this.selectedTaskId = task.id;
    this.save();
    return task;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    if (task.completed && this.selectedTaskId === id) {
      this.selectedTaskId = null;
      const nextIncomplete = this.tasks.find(t => !t.completed);
      if (nextIncomplete) this.selectedTaskId = nextIncomplete.id;
    } else if (!task.completed && !this.selectedTaskId) {
      this.selectedTaskId = task.id;
    }
    this.save();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.selectedTaskId === id) {
      this.selectedTaskId = null;
      const nextIncomplete = this.tasks.find(t => !t.completed);
      if (nextIncomplete) this.selectedTaskId = nextIncomplete.id;
    }
    this.save();
  }

  updateCompletedPoms(id, count) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completedPoms = Math.max(0, Math.min(task.estPoms, count));
    this.save();
  }

  updateEstPoms(id, count) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.estPoms = Math.max(1, Math.min(12, count));
    // Ensure completed poms doesn't exceed new est count
    if (task.completedPoms > task.estPoms) {
      task.completedPoms = task.estPoms;
    }
    this.save();
  }

  incrementCompletedPoms(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completedPoms = Math.min(task.estPoms, task.completedPoms + 1);
    this.save();
    return task;
  }

  selectTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task && !task.completed) {
      this.selectedTaskId = id;
      this.save();
    }
  }

  getSelectedTask() {
    return this.tasks.find(t => t.id === this.selectedTaskId) || null;
  }

  getTasksStats() {
    const completed = this.tasks.filter(t => t.completed).length;
    const total = this.tasks.length;
    return {
      completed,
      total,
      completionPct: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  render(incompleteListEl, completedListEl, completedCountEl, completedAccordionEl, expandedTaskId, onToggleDetails) {
    if (!incompleteListEl || !completedListEl) return;
    incompleteListEl.innerHTML = '';
    completedListEl.innerHTML = '';

    const incompleteTasks = this.tasks.filter(t => !t.completed).sort((a, b) => b.createdAt - a.createdAt);
    const completedTasks = this.tasks.filter(t => t.completed).sort((a, b) => b.createdAt - a.createdAt);

    incompleteTasks.forEach(task => {
      incompleteListEl.appendChild(this.createTaskElement(task, expandedTaskId === task.id, onToggleDetails));
    });
    completedTasks.forEach(task => {
      completedListEl.appendChild(this.createTaskElement(task, false, onToggleDetails));
    });

    if (completedCountEl) completedCountEl.textContent = completedTasks.length;
    if (completedAccordionEl) {
      if (completedTasks.length > 0) completedAccordionEl.classList.remove('hidden');
      else completedAccordionEl.classList.add('hidden');
    }
  }

  createTaskElement(task, isExpanded, onToggleDetails) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');
    if (task.id === this.selectedTaskId) li.classList.add('active-focus');

    const mainRow = document.createElement('div');
    mainRow.className = 'task-main-row';

    const checkbox = document.createElement('button');
    checkbox.className = 'task-checkbox';
    if (task.completed) checkbox.classList.add('checked');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleComplete(task.id);
    });

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const badge = document.createElement('span');
    badge.className = 'task-poms-badge';
    badge.textContent = `${task.completedPoms}/${task.estPoms} 🍅`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this task?')) {
        this.deleteTask(task.id);
      }
    });

    mainRow.appendChild(checkbox);
    mainRow.appendChild(title);
    mainRow.appendChild(badge);
    mainRow.appendChild(deleteBtn);
    li.appendChild(mainRow);

    if (isExpanded && !task.completed) {
      const details = document.createElement('div');
      details.className = 'task-details-edit-container';
      details.style.display = 'flex';
      details.style.flexDirection = 'column';
      details.style.gap = '8px';
      details.style.marginTop = '8px';
      details.style.paddingTop = '8px';
      details.style.borderTop = '1px solid var(--dot-border)';
      details.style.width = '100%';

      // Estimated Row
      const estRow = document.createElement('div');
      estRow.className = 'task-details-row';
      estRow.style.display = 'flex';
      estRow.style.alignItems = 'center';
      estRow.style.justifyContent = 'space-between';
      estRow.style.width = '100%';

      const label = document.createElement('span');
      label.className = 'edit-label';
      label.textContent = 'Estimated Pomodoros';

      const counter = document.createElement('div');
      counter.className = 'poms-counter-wrapper';

      const btnMinus = document.createElement('button');
      btnMinus.className = 'counter-btn';
      btnMinus.textContent = '-';
      btnMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateEstPoms(task.id, task.estPoms - 1);
      });

      const value = document.createElement('span');
      value.className = 'counter-value';
      value.textContent = task.estPoms;

      const btnPlus = document.createElement('button');
      btnPlus.className = 'counter-btn';
      btnPlus.textContent = '+';
      btnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateEstPoms(task.id, task.estPoms + 1);
      });

      counter.appendChild(btnMinus);
      counter.appendChild(value);
      counter.appendChild(btnPlus);
      estRow.appendChild(label);
      estRow.appendChild(counter);
      details.appendChild(estRow);

      // Completed Row
      const compRow = document.createElement('div');
      compRow.className = 'task-details-row';
      compRow.style.display = 'flex';
      compRow.style.alignItems = 'center';
      compRow.style.justifyContent = 'space-between';
      compRow.style.width = '100%';

      const completedLabel = document.createElement('span');
      completedLabel.className = 'edit-label';
      completedLabel.textContent = 'Completed Pomodoros';

      const completedCounter = document.createElement('div');
      completedCounter.className = 'poms-counter-wrapper';

      const btnCompMinus = document.createElement('button');
      btnCompMinus.className = 'counter-btn';
      btnCompMinus.textContent = '-';
      btnCompMinus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateCompletedPoms(task.id, task.completedPoms - 1);
      });

      const compValue = document.createElement('span');
      compValue.className = 'counter-value';
      compValue.textContent = task.completedPoms;

      const btnCompPlus = document.createElement('button');
      btnCompPlus.className = 'counter-btn';
      btnCompPlus.textContent = '+';
      btnCompPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateCompletedPoms(task.id, task.completedPoms + 1);
      });

      completedCounter.appendChild(btnCompMinus);
      completedCounter.appendChild(compValue);
      completedCounter.appendChild(btnCompPlus);
      compRow.appendChild(completedLabel);
      compRow.appendChild(completedCounter);
      details.appendChild(compRow);

      li.appendChild(details);
    }

    li.addEventListener('click', () => {
      if (task.completed) return;
      this.selectTask(task.id);
      if (onToggleDetails) onToggleDetails(task.id);
    });

    return li;
  }
}

// ==========================================
// 8. POMODORO TIMER
// ==========================================
class PomodoroTimer {
  constructor(options) {
    this.onTick = options.onTick;
    this.onStateChange = options.onStateChange;
    this.onSessionComplete = options.onSessionComplete;

    try {
      const stored = JSON.parse(localStorage.getItem('pomodoro_config'));
      this.config = (stored && typeof stored === 'object') ? stored : { work: 25, break: 5, longBreak: 15 };
    } catch (e) {
      this.config = { work: 25, break: 5, longBreak: 15 };
    }
    if (!this.config || typeof this.config !== 'object') this.config = { work: 25, break: 5, longBreak: 15 };
    if (typeof this.config.work !== 'number') this.config.work = 25;
    if (typeof this.config.break !== 'number') this.config.break = 5;
    if (typeof this.config.longBreak !== 'number') this.config.longBreak = 15;

    this.currentMode = 'work';
    this.timerState = 'READY';
    this.timeLeft = this.config[this.currentMode] * 60;
    this.totalDuration = this.timeLeft;
    this.intervalId = null;

    const lastDateStr = localStorage.getItem('pomodoro_last_date');
    const todayStr = new Date().toDateString();
    if (lastDateStr !== todayStr) {
      this.workSessionsCount = 0;
      localStorage.setItem('pomodoro_last_date', todayStr);
      localStorage.setItem('pomodoro_work_count', '0');
    } else {
      try {
        const count = JSON.parse(localStorage.getItem('pomodoro_work_count'));
        this.workSessionsCount = typeof count === 'number' ? count : 0;
      } catch (e) {
        this.workSessionsCount = 0;
      }
    }
  }

  saveConfig() {
    localStorage.setItem('pomodoro_config', JSON.stringify(this.config));
  }

  saveWorkCount() {
    localStorage.setItem('pomodoro_work_count', JSON.stringify(this.workSessionsCount));
    localStorage.setItem('pomodoro_last_date', new Date().toDateString());
  }

  setMode(mode) {
    if (this.currentMode === mode && this.timerState !== 'FINISHED') return;
    this.stopTicker();
    this.currentMode = mode;
    this.timerState = 'READY';
    this.timeLeft = this.config[mode] * 60;
    this.totalDuration = this.timeLeft;
    if (this.onStateChange) this.onStateChange(this.timerState);
    if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
  }

  start() {
    if (this.timerState !== 'READY' && this.timerState !== 'PAUSED' && this.timerState !== 'FINISHED') return;
    this.timerState = 'RUNNING';
    if (this.onStateChange) this.onStateChange(this.timerState);
    this.startTicker();
  }

  pause() {
    if (this.timerState !== 'RUNNING') return;
    this.stopTicker();
    this.timerState = 'PAUSED';
    if (this.onStateChange) this.onStateChange(this.timerState);
  }

  reset() {
    this.stopTicker();
    this.timerState = 'READY';
    this.timeLeft = this.config[this.currentMode] * 60;
    this.totalDuration = this.timeLeft;
    if (this.onStateChange) this.onStateChange(this.timerState);
    if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
  }

  startTicker() {
    this.stopTicker();
    let lastTime = performance.now();
    const step = (time) => {
      if (this.timerState !== 'RUNNING') return;
      const delta = time - lastTime;
      if (delta >= 1000) {
        const secondsElapsed = Math.floor(delta / 1000);
        this.timeLeft = Math.max(0, this.timeLeft - secondsElapsed);
        lastTime = time - (delta % 1000);
        if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
        if (this.timeLeft === 0) {
          this.handleTimerEnd();
          return;
        }
      }
      this.intervalId = requestAnimationFrame(step);
    };
    this.intervalId = requestAnimationFrame(step);
  }

  stopTicker() {
    if (this.intervalId) {
      cancelAnimationFrame(this.intervalId);
      this.intervalId = null;
    }
  }

  handleTimerEnd() {
    this.stopTicker();
    this.timerState = 'FINISHED';
    let nextMode = 'work';
    if (this.currentMode === 'work') {
      this.workSessionsCount++;
      this.saveWorkCount();
      if (this.workSessionsCount % 4 === 0) nextMode = 'longBreak';
      else nextMode = 'break';
    } else {
      nextMode = 'work';
    }
    if (this.onSessionComplete) this.onSessionComplete(this.currentMode, nextMode);
    if (this.onStateChange) this.onStateChange(this.timerState);
  }

  getStats() {
    const totalMinutes = this.workSessionsCount * this.config.work;
    const breakMinutes = Math.floor(this.workSessionsCount / 4) * this.config.longBreak + 
                          (this.workSessionsCount - Math.floor(this.workSessionsCount / 4)) * this.config.break;
    return {
      completedPoms: this.workSessionsCount,
      focusedTime: `${totalMinutes}m`,
      breakTime: `${this.workSessionsCount > 0 ? breakMinutes : 0}m`
    };
  }
}

// ==========================================
// 9. FOCUS PANEL MANAGER
// ==========================================
class FocusPanelManager {
  constructor() {
    console.log("FocusPanelManager: constructor starting...");
    this.panel = document.getElementById('focus-panel');
    this.overlay = document.getElementById('panel-overlay');
    this.menuBtn = document.getElementById('menu-btn');
    this.closeBtn = document.getElementById('panel-close-btn');

    this.taskInput = document.getElementById('task-input');
    this.taskList = document.getElementById('task-list');
    this.completedTaskList = document.getElementById('completed-task-list');
    this.completedCount = document.getElementById('completed-count');
    this.completedAccordion = document.getElementById('completed-accordion');
    this.toggleCompletedBtn = document.getElementById('toggle-completed-btn');

    this.selectedTitle = document.getElementById('selected-task-title');
    this.selectedProgress = document.getElementById('selected-task-progress');
    this.timerDisplay = document.getElementById('timer-display');
    this.progressFill = document.getElementById('timer-progress-fill');
    this.progressSpark = document.getElementById('timer-progress-spark');
    this.primaryBtn = document.getElementById('primary-timer-btn');
    this.resetBtn = document.getElementById('reset-timer-btn');
    this.notification = document.getElementById('focus-notification');
    this.notificationMsg = document.getElementById('notification-message');

    this.statCompletedPoms = document.getElementById('stat-completed-poms');
    this.statFocusTime = document.getElementById('stat-focus-time');
    this.statBreakTime = document.getElementById('stat-break-time');
    this.statCompletionPct = document.getElementById('stat-completion-pct');

    this.expandedTaskId = null;
    this.isOpen = false;
    this.completedExpanded = false;

    this.init();
  }

  init() {
    console.log("FocusPanelManager: init starting...");
    this.todoManager = new TodoManager(() => this.updateUI());
    this.timer = new PomodoroTimer({
      onTick: (left, total) => this.handleTimerTick(left, total),
      onStateChange: (state) => this.handleTimerStateChange(state),
      onSessionComplete: (mode, nextMode) => this.handleSessionComplete(mode, nextMode)
    });

    if (this.menuBtn) this.menuBtn.addEventListener('click', () => this.openPanel());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closePanel());
    if (this.overlay) this.overlay.addEventListener('click', () => this.closePanel());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closePanel();
        e.preventDefault();
      }
      if (e.code === 'Space' && this.isOpen && document.activeElement !== this.taskInput) {
        e.preventDefault();
        this.toggleTimerState();
      }
    });

    if (this.taskInput) {
      this.taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.todoManager.addTask(this.taskInput.value);
          this.taskInput.value = '';
          e.preventDefault();
        }
      });
    }

    if (this.toggleCompletedBtn) {
      this.toggleCompletedBtn.addEventListener('click', () => {
        this.completedExpanded = !this.completedExpanded;
        this.toggleCompletedBtn.setAttribute('aria-expanded', this.completedExpanded);
        if (this.completedExpanded) {
          this.completedTaskList.classList.remove('hidden');
        } else {
          this.completedTaskList.classList.add('hidden');
        }
      });
    }

    const timerModes = document.getElementById('timer-modes');
    if (timerModes) {
      timerModes.addEventListener('click', (e) => {
        const btn = e.target.closest('.timer-mode-btn');
        if (!btn) return;
        const mode = btn.getAttribute('data-mode');
        this.timer.setMode(mode);
        const modeBtns = timerModes.querySelectorAll('.timer-mode-btn');
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    }

    if (this.primaryBtn) {
      this.primaryBtn.addEventListener('click', () => this.handlePrimaryAction());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.timer.reset());
    }

    this.setupFocusTrapping();
    this.updateUI();
    this.fetchCommits();
    console.log("FocusPanelManager: init successfully completed.");
  }

  async fetchCommits() {
    const container = document.getElementById('commits-container');
    if (!container) return;

    try {
      const response = await fetch('https://api.github.com/repos/shubham2007p/Time-Tracker-ButAesthetic/commits?per_page=20');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const commits = await response.json();
      if (!commits || commits.length === 0) {
        container.innerHTML = '<span class="muted-text">No commits found.</span>';
        return;
      }

      const escapeHTML = (str) => str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );

      container.innerHTML = commits.map(commit => {
        const message = commit.commit.message.split('\n')[0];
        const date = new Date(commit.commit.author.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const sha = commit.sha.substring(0, 7);
        const url = commit.html_url;
        const author = commit.commit.author.name;

        return `
          <div class="commit-item">
            <div class="commit-header">
              <span class="commit-sha"><a href="${url}" target="_blank" rel="noopener noreferrer">${sha}</a></span>
              <span class="commit-date">${date}</span>
            </div>
            <div class="commit-message">${escapeHTML(message)}</div>
            <div class="commit-author">by ${escapeHTML(author)}</div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error fetching commits:', error);
      container.innerHTML = '<span class="muted-text error-text">Failed to load commits.</span>';
    }
  }

  openPanel() {
    this.isOpen = true;
    this.panel.classList.add('active');
    this.overlay.classList.add('active');
    this.panel.setAttribute('aria-hidden', 'false');
    this.panel.focus();
    this.fetchCommits();
  }

  closePanel() {
    this.isOpen = false;
    this.panel.classList.remove('active');
    this.overlay.classList.remove('active');
    this.panel.setAttribute('aria-hidden', 'true');
    if (this.menuBtn) this.menuBtn.focus();
  }

  setupFocusTrapping() {
    this.panel.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusableElements = this.panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
  }

  toggleTimerState() {
    const task = this.todoManager.getSelectedTask();
    if (!task) return;
    if (this.timer.timerState === 'RUNNING') this.timer.pause();
    else this.timer.start();
  }

  handlePrimaryAction() {
    const task = this.todoManager.getSelectedTask();
    if (!task) return;
    if (this.timer.timerState === 'READY' || this.timer.timerState === 'PAUSED' || this.timer.timerState === 'FINISHED') {
      this.timer.start();
    } else if (this.timer.timerState === 'RUNNING') {
      this.timer.pause();
    }
  }

  handleTimerTick(left, total) {
    const min = String(Math.floor(left / 60)).padStart(2, '0');
    const sec = String(left % 60).padStart(2, '0');
    if (this.timerDisplay) this.timerDisplay.textContent = `${min}:${sec}`;
    const pct = ((total - left) / total) * 100;
    if (this.progressFill) this.progressFill.style.width = `${pct}%`;
    if (this.progressSpark) this.progressSpark.style.left = `${pct}%`;
  }

  handleTimerStateChange(state) {
    const task = this.todoManager.getSelectedTask();
    if (!task) {
      if (this.primaryBtn) {
        this.primaryBtn.textContent = 'START';
        this.primaryBtn.classList.add('disabled');
        this.primaryBtn.disabled = true;
      }
      if (this.resetBtn) this.resetBtn.classList.add('hidden');
      return;
    }
    if (this.primaryBtn) {
      this.primaryBtn.classList.remove('disabled');
      this.primaryBtn.disabled = false;
    }
    if (state === 'READY') {
      if (this.primaryBtn) this.primaryBtn.textContent = 'START';
      if (this.resetBtn) this.resetBtn.classList.add('hidden');
    } else if (state === 'RUNNING') {
      if (this.primaryBtn) this.primaryBtn.textContent = 'PAUSE';
      if (this.resetBtn) this.resetBtn.classList.remove('hidden');
    } else if (state === 'PAUSED') {
      if (this.primaryBtn) this.primaryBtn.textContent = 'RESUME';
      if (this.resetBtn) this.resetBtn.classList.remove('hidden');
    } else if (state === 'FINISHED') {
      if (this.primaryBtn) this.primaryBtn.textContent = 'START NEXT';
      if (this.resetBtn) this.resetBtn.classList.add('hidden');
    }
  }

  handleSessionComplete(mode, nextMode) {
    const task = this.todoManager.getSelectedTask();
    if (mode === 'work' && task) {
      const updatedTask = this.todoManager.incrementCompletedPoms(task.id);
      this.showNotification('🍅 Work session complete. Time for a break.');
      if (updatedTask && updatedTask.completedPoms >= updatedTask.estPoms) {
        this.suggestTaskCompletion(updatedTask);
      }
    } else if (mode === 'break' || mode === 'longBreak') {
      this.showNotification('Focus time! Ready to get back to work?');
    }
    this.timer.setMode(nextMode);
    const modeBtns = document.querySelectorAll('.timer-mode-btn');
    modeBtns.forEach(btn => {
      if (btn.getAttribute('data-mode') === nextMode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.updateUI();
  }

  suggestTaskCompletion(task) {
    const confirmBox = document.createElement('div');
    confirmBox.className = 'selected-task-panel confirm-completion-box';
    confirmBox.innerHTML = `
      <div class="focus-label" style="color: var(--color-accent)">Focus goal met!</div>
      <div class="selected-task-title">Mark "${task.title}" as completed?</div>
      <div style="display:flex; gap:10px; justify-content:center; margin-top:8px;">
        <button id="confirm-comp-yes" class="primary-timer-btn" style="padding: 6px 14px; font-size:0.7rem; width:auto;">Complete</button>
        <button id="confirm-comp-no" class="primary-timer-btn" style="padding: 6px 14px; font-size:0.7rem; width:auto;">Continue</button>
      </div>
    `;
    const selectedPanel = document.getElementById('selected-task-panel');
    if (selectedPanel) {
      const oldContents = selectedPanel.innerHTML;
      selectedPanel.innerHTML = '';
      selectedPanel.appendChild(confirmBox);
      document.getElementById('confirm-comp-yes').addEventListener('click', () => {
        this.todoManager.toggleComplete(task.id);
      });
      document.getElementById('confirm-comp-no').addEventListener('click', () => {
        selectedPanel.innerHTML = oldContents;
        this.updateUI();
      });
    }
  }

  showNotification(message) {
    if (!this.notification || !this.notificationMsg) return;
    this.notificationMsg.textContent = message;
    this.notification.classList.remove('hidden');
    setTimeout(() => {
      this.notification.classList.add('hidden');
    }, 5000);
  }

  updateUI() {
    this.todoManager.render(
      this.taskList, this.completedTaskList, this.completedCount, this.completedAccordion,
      this.expandedTaskId, (id) => {
        this.expandedTaskId = this.expandedTaskId === id ? null : id;
        this.updateUI();
      }
    );
    const task = this.todoManager.getSelectedTask();
    if (task) {
      if (this.selectedTitle) this.selectedTitle.textContent = task.title;
      if (this.selectedProgress) {
        this.selectedProgress.textContent = `${task.completedPoms} / ${task.estPoms} Pomodoros`;
        this.selectedProgress.classList.remove('hidden');
      }
    } else {
      if (this.selectedTitle) this.selectedTitle.textContent = 'Select a task first';
      if (this.selectedProgress) this.selectedProgress.classList.add('hidden');
    }
    this.handleTimerStateChange(this.timer.timerState);
    this.updateStats();
    if (typeof appState !== 'undefined') {
      appState.setState({});
    }
  }

  updateStats() {
    const pomStats = this.timer.getStats();
    const taskStats = this.todoManager.getTasksStats();
    if (this.statCompletedPoms) this.statCompletedPoms.textContent = pomStats.completedPoms;
    if (this.statFocusTime) this.statFocusTime.textContent = pomStats.focusedTime;
    if (this.statBreakTime) this.statBreakTime.textContent = pomStats.breakTime;
    if (this.statCompletionPct) this.statCompletionPct.textContent = `${taskStats.completionPct}%`;
  }
}

// ==========================================
// 10. ROUTER
// ==========================================
class Router {
  constructor(routes, defaultRoute) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.currentView = null;
    this.onChangeCallbacks = new Set();
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
    window.addEventListener('resize', () => this.updateNavIndicator());
  }

  handleRouting() {
    const hash = window.location.hash || `#/${this.defaultRoute}`;
    let route = hash.replace(/^#\/?/, '');
    if (!this.routes[route]) {
      route = this.defaultRoute;
      window.location.hash = `#/${this.defaultRoute}`;
      return;
    }
    this.currentView = route;
    this.updateNavUI();
    this.triggerChange(route);
  }

  onChange(callback) {
    this.onChangeCallbacks.add(callback);
    if (this.currentView) {
      callback(this.currentView);
    }
    return () => this.onChangeCallbacks.delete(callback);
  }

  triggerChange(view) {
    const container = document.getElementById('grid-container');
    if (container) {
      container.classList.remove('active');
      setTimeout(() => {
        this.onChangeCallbacks.forEach(cb => cb(view));
        container.classList.add('active');
      }, 150);
    } else {
      this.onChangeCallbacks.forEach(cb => cb(view));
    }
  }

  updateNavUI() {
    const navItems = document.querySelectorAll('.nav-item');
    let activeItem = null;
    navItems.forEach(item => {
      const routeAttr = item.getAttribute('data-route');
      if (routeAttr === this.currentView) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
        activeItem = item;
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
    if (activeItem) {
      this.updateNavIndicator(activeItem);
    }
  }

  updateNavIndicator(activeItem = null) {
    const indicator = document.getElementById('nav-indicator');
    if (!indicator) return;
    if (!activeItem) {
      activeItem = document.querySelector('.nav-item.active');
    }
    if (activeItem) {
      indicator.style.left = `${activeItem.offsetLeft}px`;
      indicator.style.width = `${activeItem.offsetWidth}px`;
    }
  }
}

// ==========================================
// 11. BOOTSTRAP / INITIALIZATION
// ==========================================
const initApp = () => {
  console.log("initApp: App initializing...");
  const themeManager = new ThemeManager();
  const timeCoordinator = new TimeCoordinator();
  let focusPanelManager = null;
  try {
    console.log("Instantiating FocusPanelManager...");
    focusPanelManager = new FocusPanelManager();
    console.log("FocusPanelManager instantiated successfully.");
  } catch (e) {
    console.error("FocusPanelManager initialization failed:", e);
  }
  
  const container = document.getElementById('grid-container');
  const dayHeader = document.getElementById('time-day');
  const dateHeader = document.getElementById('time-date');
  const themeBtn = document.getElementById('theme-btn');
  
  const progressArcFill = document.getElementById('progress-arc-fill');
  const progressArcFocus = document.getElementById('progress-arc-focus');
  const arcPercentage = document.getElementById('arc-percentage');
  const arcLabel = document.getElementById('arc-label');
  const statsContainer = document.getElementById('stats-container');
  
  const modeSwitchContainer = document.getElementById('mode-switch-container');
  const modeDaysBtn = document.getElementById('mode-days');
  const modeHoursBtn = document.getElementById('mode-hours');
  
  let currentTime = new Date();

  const viewRenderers = {
    day: (c, d) => renderDayView(c, d),
    week: (c, d) => renderWeekView(c, d),
    month: (c, d, mode) => renderMonthView(c, d, mode),
    year: (c, d, mode) => renderYearView(c, d, mode)
  };

  const arcLabels = {
    day: 'TODAY',
    week: 'THIS WEEK',
    month: 'THIS MONTH',
    year: 'THIS YEAR'
  };

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      themeManager.cycleTheme();
    });
  }

  window.addEventListener('themechanged', (e) => {
    appState.setState({ theme: e.detail.theme });
  });

  appState.setState({ theme: themeManager.getCurrentTheme() });

  if (modeSwitchContainer) {
    modeSwitchContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.mode-btn');
      if (!btn) return;
      
      const mode = btn.getAttribute('data-mode');
      const currentView = appState.getState().currentView;
      
      if (currentView === 'month') {
        appState.setState({ monthMode: mode });
      } else if (currentView === 'year') {
        appState.setState({ yearMode: mode });
      }
    });
  }

  const renderApp = (state) => {
    const view = state.currentView;
    const mode = view === 'month' ? state.monthMode : state.yearMode;

    const headers = formatHeader(currentTime);
    if (dayHeader) dayHeader.textContent = headers.dayName;
    if (dateHeader) dateHeader.textContent = headers.dateString;

    if (modeSwitchContainer) {
      if (view === 'month' || view === 'year') {
        modeSwitchContainer.classList.remove('hidden');
        if (mode === 'days') {
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

    const renderer = viewRenderers[view];
    if (renderer && container) {
      const { percentage, stats } = renderer(container, currentTime, mode);

      if (arcPercentage) arcPercentage.textContent = `${Math.round(percentage)}%`;
      if (arcLabel) arcLabel.textContent = arcLabels[view] || '';
      if (progressArcFill) {
        DotRenderer.updateArc(progressArcFill, percentage);
        if (view === 'day') {
          progressArcFill.classList.add('completed-muted');
        } else {
          progressArcFill.classList.remove('completed-muted');
        }
      }
      if (progressArcFocus) {
        if (view === 'day') {
          let workSessionsCount = 0;
          let workDuration = 25;
          try {
            const count = JSON.parse(localStorage.getItem('pomodoro_work_count'));
            workSessionsCount = typeof count === 'number' ? count : 0;
            const config = JSON.parse(localStorage.getItem('pomodoro_config'));
            if (config && typeof config.work === 'number') {
              workDuration = config.work;
            }
          } catch (e) {}
          const focusedMinutes = workSessionsCount * workDuration;
          const focusedHours = focusedMinutes / 60;
          const focusedPct = (focusedHours / 24) * 100;
          
          DotRenderer.updateArc(progressArcFocus, focusedPct);
          progressArcFocus.style.display = 'block';
        } else {
          progressArcFocus.style.display = 'none';
        }
      }

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

  appState.subscribe((state) => {
    renderApp(state);
  });

  const routes = {
    day: 'day',
    week: 'week',
    month: 'month',
    year: 'year'
  };
  
  const router = new Router(routes, appState.getState().currentView);

  router.onChange((view) => {
    appState.setState({ currentView: view });
    setTimeout(() => {
      router.updateNavIndicator();
    }, 50);
  });

  timeCoordinator.subscribe((now, changes) => {
    currentTime = now;
    if (changes && changes.dayChanged) {
      const todayStr = now.toDateString();
      localStorage.setItem('pomodoro_last_date', todayStr);
      localStorage.setItem('pomodoro_work_count', '0');
      if (focusPanelManager && focusPanelManager.timer) {
        focusPanelManager.timer.workSessionsCount = 0;
        focusPanelManager.updateUI();
      }
    }
    requestAnimationFrame(() => {
      renderApp(appState.getState());
    });
  });

  timeCoordinator.start();

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, index) => {
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
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
