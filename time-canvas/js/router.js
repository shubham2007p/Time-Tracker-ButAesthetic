/**
 * Simple hash-based router for Time Canvas
 */

export class Router {
  constructor(routes, defaultRoute) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.currentView = null;
    this.onChangeCallbacks = new Set();
    
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Initial routing
    this.handleRouting();
    
    // Reposition nav indicator on window resize to ensure correct alignment
    window.addEventListener('resize', () => this.updateNavIndicator());
  }

  handleRouting() {
    const hash = window.location.hash || `#/${this.defaultRoute}`;
    // Extract route name, e.g. '#/week' -> 'week'
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
      // Smooth fade-out before switching content
      container.classList.remove('active');
      
      setTimeout(() => {
        this.onChangeCallbacks.forEach(cb => cb(view));
        // Fade back in
        container.classList.add('active');
      }, 150); // half of transition speed
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
