/**
 * Time coordinator for Time Canvas
 */

export class TimeCoordinator {
  constructor() {
    this.listeners = new Set();
    this.lastTime = new Date();
    this.intervalId = null;
  }

  start() {
    this.tick();
    
    // Check every 1000ms for high precision alignment, but we only notify when time fields change
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
    // Call immediately for initial state
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
        callback(now, {
          minuteChanged,
          hourChanged,
          dayChanged,
          monthChanged,
          yearChanged
        });
      });
      this.lastTime = now;
    }
  }
}
