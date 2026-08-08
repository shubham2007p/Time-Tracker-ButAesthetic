/**
 * Todos state manager and view renderer
 */

export class TodoManager {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    try {
      const stored = JSON.parse(localStorage.getItem('focus_tasks'));
      this.tasks = Array.isArray(stored) ? stored : [];
    } catch (e) {
      this.tasks = [];
    }
    this.selectedTaskId = localStorage.getItem('focus_selected_task_id') || null;
    
    // Ensure selected task exists
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
    
    // Automatically select the newly created task if none is selected
    if (!this.selectedTaskId) {
      this.selectedTaskId = task.id;
    }
    
    this.save();
    return task;
  }

  toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    
    // Clear selection if the completed task was selected
    if (task.completed && this.selectedTaskId === id) {
      this.selectedTaskId = null;
      // Auto-select another incomplete task if available
      const nextIncomplete = this.tasks.find(t => !t.completed);
      if (nextIncomplete) {
        this.selectedTaskId = nextIncomplete.id;
      }
    } else if (!task.completed && !this.selectedTaskId) {
      // Re-select if it was uncompleted and nothing else is selected
      this.selectedTaskId = task.id;
    }
    
    this.save();
  }

  updateEstPoms(id, count) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.estPoms = Math.max(1, Math.min(12, count));
    this.save();
  }

  incrementCompletedPoms(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    task.completedPoms = Math.min(task.estPoms, task.completedPoms + 1);
    this.save();
    return task;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.selectedTaskId === id) {
      this.selectedTaskId = this.tasks.find(t => !t.completed)?.id || null;
    }
    this.save();
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

  /**
   * Renders the lists of incomplete and completed tasks in the DOM
   */
  render(incompleteListEl, completedListEl, completedCountEl, completedAccordionEl, expandedTaskId, onToggleDetails) {
    if (!incompleteListEl || !completedListEl) return;

    incompleteListEl.innerHTML = '';
    completedListEl.innerHTML = '';

    const incompleteTasks = this.tasks.filter(t => !t.completed).sort((a, b) => b.createdAt - a.createdAt);
    const completedTasks = this.tasks.filter(t => t.completed).sort((a, b) => b.createdAt - a.createdAt);

    // 1. Render Incomplete Tasks
    incompleteTasks.forEach(task => {
      const li = this.createTaskElement(task, expandedTaskId === task.id, onToggleDetails);
      incompleteListEl.appendChild(li);
    });

    // 2. Render Completed Tasks
    completedTasks.forEach(task => {
      const li = this.createTaskElement(task, false, onToggleDetails);
      completedListEl.appendChild(li);
    });

    // 3. Update Completed Accordion count & visibility
    if (completedCountEl) completedCountEl.textContent = completedTasks.length;
    if (completedAccordionEl) {
      if (completedTasks.length > 0) {
        completedAccordionEl.classList.remove('hidden');
      } else {
        completedAccordionEl.classList.add('hidden');
      }
    }
  }

  createTaskElement(task, isExpanded, onToggleDetails) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');
    if (task.id === this.selectedTaskId) li.classList.add('active-focus');
    li.setAttribute('data-id', task.id);

    // Main Row
    const mainRow = document.createElement('div');
    mainRow.className = 'task-main-row';

    // Checkbox
    const checkbox = document.createElement('button');
    checkbox.className = 'task-checkbox';
    if (task.completed) checkbox.classList.add('checked');
    checkbox.setAttribute('aria-label', task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`);
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleComplete(task.id);
    });

    // Title
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    // Badges / Pomodoro info
    const badge = document.createElement('span');
    badge.className = 'task-poms-badge';
    badge.textContent = `${task.completedPoms}/${task.estPoms} 🍅`;

    mainRow.appendChild(checkbox);
    mainRow.appendChild(title);
    mainRow.appendChild(badge);
    li.appendChild(mainRow);

    // Expand details if active & not completed
    if (isExpanded && !task.completed) {
      const details = document.createElement('div');
      details.className = 'task-details-edit';

      const label = document.createElement('span');
      label.className = 'edit-label';
      label.textContent = 'Estimated Pomodoros';

      const counter = document.createElement('div');
      counter.className = 'poms-counter-wrapper';

      const btnMinus = document.createElement('button');
      btnMinus.className = 'counter-btn';
      btnMinus.textContent = '-';
      btnMinus.setAttribute('aria-label', 'Decrease estimate');
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
      btnPlus.setAttribute('aria-label', 'Increase estimate');
      btnPlus.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateEstPoms(task.id, task.estPoms + 1);
      });

      counter.appendChild(btnMinus);
      counter.appendChild(value);
      counter.appendChild(btnPlus);
      details.appendChild(label);
      details.appendChild(counter);
      li.appendChild(details);
    }

    // Toggle Details or Select Task on item click
    li.addEventListener('click', () => {
      if (task.completed) return;
      this.selectTask(task.id);
      if (onToggleDetails) {
        onToggleDetails(task.id);
      }
    });

    return li;
  }
}
