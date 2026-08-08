import { TodoManager } from './todos.js';
import { PomodoroTimer } from './pomodoro.js';

export class FocusPanelManager {
  constructor() {
    console.log("FocusPanelManager: constructor starting...");
    this.panel = document.getElementById('focus-panel');
    this.overlay = document.getElementById('panel-overlay');
    this.menuBtn = document.getElementById('menu-btn');
    this.closeBtn = document.getElementById('panel-close-btn');
    
    console.log("FocusPanelManager: menuBtn found?", !!this.menuBtn);
    console.log("FocusPanelManager: panel found?", !!this.panel);

    // Todos UI
    this.taskInput = document.getElementById('task-input');
    this.taskList = document.getElementById('task-list');
    this.completedTaskList = document.getElementById('completed-task-list');
    this.completedCount = document.getElementById('completed-count');
    this.completedAccordion = document.getElementById('completed-accordion');
    this.toggleCompletedBtn = document.getElementById('toggle-completed-btn');
    
    // Pomodoro UI
    this.selectedTitle = document.getElementById('selected-task-title');
    this.selectedProgress = document.getElementById('selected-task-progress');
    this.timerDisplay = document.getElementById('timer-display');
    this.progressFill = document.getElementById('timer-progress-fill');
    this.progressSpark = document.getElementById('timer-progress-spark');
    this.primaryBtn = document.getElementById('primary-timer-btn');
    this.resetBtn = document.getElementById('reset-timer-btn');
    this.notification = document.getElementById('focus-notification');
    this.notificationMsg = document.getElementById('notification-message');
    
    // Stats UI
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
    // 1. Initialize Todo & Timer managers
    this.todoManager = new TodoManager(() => this.updateUI());
    this.timer = new PomodoroTimer({
      onTick: (left, total) => this.handleTimerTick(left, total),
      onStateChange: (state) => this.handleTimerStateChange(state),
      onSessionComplete: (mode, nextMode) => this.handleSessionComplete(mode, nextMode)
    });

    // 2. Open/Close panel events
    if (this.menuBtn) this.menuBtn.addEventListener('click', () => this.openPanel());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closePanel());
    if (this.overlay) this.overlay.addEventListener('click', () => this.closePanel());

    // Keyboard Shortcuts & Focus trapping
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

    // Add Task Event
    if (this.taskInput) {
      this.taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.todoManager.addTask(this.taskInput.value);
          this.taskInput.value = '';
          e.preventDefault();
        }
      });
    }

    // Toggle Completed Accordion
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

    // Timer Mode buttons using event delegation on parent
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

    // Primary timer action
    if (this.primaryBtn) {
      this.primaryBtn.addEventListener('click', () => {
        this.handlePrimaryAction();
      });
    }

    // Reset timer action
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.timer.reset();
      });
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

    if (this.timer.timerState === 'RUNNING') {
      this.timer.pause();
    } else {
      this.timer.start();
    }
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
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `${min}:${sec}`;
    }

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
      
      // Auto suggest completing task if required poms finished
      if (updatedTask && updatedTask.completedPoms >= updatedTask.estPoms) {
        this.suggestTaskCompletion(updatedTask);
      }
    } else if (mode === 'break' || mode === 'longBreak') {
      this.showNotification('Focus time! Ready to get back to work?');
    }

    // Auto-set the next mode in timer segmented control
    this.timer.setMode(nextMode);
    const modeBtns = document.querySelectorAll('.timer-mode-btn');
    modeBtns.forEach(btn => {
      if (btn.getAttribute('data-mode') === nextMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
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
    // 1. Render tasks
    this.todoManager.render(
      this.taskList,
      this.completedTaskList,
      this.completedCount,
      this.completedAccordion,
      this.expandedTaskId,
      (id) => {
        this.expandedTaskId = this.expandedTaskId === id ? null : id;
        this.updateUI();
      }
    );

    // 2. Render current selected task status
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

    // 3. Update timer controls/button state
    this.handleTimerStateChange(this.timer.timerState);

    // 4. Update session statistics
    this.updateStats();
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
