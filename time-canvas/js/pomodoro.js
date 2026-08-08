/**
 * Pomodoro timer engine and state coordinator
 */

export class PomodoroTimer {
  constructor(options) {
    this.onTick = options.onTick;
    this.onStateChange = options.onStateChange;
    this.onSessionComplete = options.onSessionComplete;

    // Load configurations from storage or use defaults
    try {
      const stored = JSON.parse(localStorage.getItem('pomodoro_config'));
      this.config = (stored && typeof stored === 'object') ? stored : {
        work: 25,
        break: 5,
        longBreak: 15
      };
    } catch (e) {
      this.config = {
        work: 25,
        break: 5,
        longBreak: 15
      };
    }

    // Ensure all config keys are populated
    if (!this.config || typeof this.config !== 'object') {
      this.config = { work: 25, break: 5, longBreak: 15 };
    }
    if (typeof this.config.work !== 'number') this.config.work = 25;
    if (typeof this.config.break !== 'number') this.config.break = 5;
    if (typeof this.config.longBreak !== 'number') this.config.longBreak = 15;

    this.currentMode = 'work'; // 'work' | 'break' | 'longBreak'
    this.timerState = 'READY'; // 'READY' | 'RUNNING' | 'PAUSED' | 'FINISHED'
    
    this.timeLeft = this.config[this.currentMode] * 60; // seconds
    this.totalDuration = this.timeLeft;

    this.intervalId = null;
    try {
      const count = JSON.parse(localStorage.getItem('pomodoro_work_count'));
      this.workSessionsCount = typeof count === 'number' ? count : 0;
    } catch (e) {
      this.workSessionsCount = 0;
    }
  }

  saveConfig() {
    localStorage.setItem('pomodoro_config', JSON.stringify(this.config));
  }

  saveWorkCount() {
    localStorage.setItem('pomodoro_work_count', JSON.stringify(this.workSessionsCount));
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
      
      // Every 4th work session triggers a long break, else regular break
      if (this.workSessionsCount % 4 === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'break';
      }
    } else {
      nextMode = 'work';
    }

    if (this.onSessionComplete) {
      this.onSessionComplete(this.currentMode, nextMode);
    }
    
    if (this.onStateChange) this.onStateChange(this.timerState);
  }

  updateConfig(mode, minutes) {
    // Apply limits
    let val = minutes;
    if (mode === 'work') val = Math.max(10, Math.min(90, minutes));
    else if (mode === 'break') val = Math.max(3, Math.min(20, minutes));
    else if (mode === 'longBreak') val = Math.max(10, Math.min(45, minutes));

    this.config[mode] = val;
    this.saveConfig();

    if (this.timerState === 'READY' && this.currentMode === mode) {
      this.timeLeft = val * 60;
      this.totalDuration = this.timeLeft;
      if (this.onTick) this.onTick(this.timeLeft, this.totalDuration);
    }
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
