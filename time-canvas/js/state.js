/**
 * Central State Manager for Time Canvas
 */

class StateManager {
  constructor() {
    // Determine initial view from hash or default to 'day'
    const initialView = window.location.hash.replace(/^#\/?/, '') || 'day';
    
    // Load config or use defaults
    this.state = {
      currentView: ['day', 'week', 'month', 'year'].includes(initialView) ? initialView : 'day',
      monthMode: localStorage.getItem('month_mode') || 'days', // 'days' | 'hours'
      yearMode: localStorage.getItem('year_mode') || 'days',   // 'days' | 'hours'
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

    // Persist changes to localStorage if they updated
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

    // Call listeners only if state actually changed
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
    // Call initially
    callback(this.state, this.state);
    return () => this.listeners.delete(callback);
  }
}

export const appState = new StateManager();
