/**
 * Reusable and optimized DOM dot renderer with grouped view support.
 */

export class DotRenderer {
  /**
   * Updates or creates dots in a container using diffing.
   * @param {HTMLElement} container
   * @param {Array<{id: number|string, status: 'completed' | 'current' | 'future', label: string}>} dotStates
   */
  static render(container, dotStates) {
    const existingDots = container.children;
    const requiredCount = dotStates.length;
    
    // Clear grouped wrappers if they exist
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
      } else if (state.status === 'current') {
        targetClass = 'dot current';
      }
      
      if (dotElement.className !== targetClass) {
        dotElement.className = targetClass;
      }
      
      if (dotElement.getAttribute('aria-label') !== state.label) {
        dotElement.setAttribute('aria-label', state.label);
      }
      
      if (dotElement.getAttribute('role') !== 'img') {
        dotElement.setAttribute('role', 'img');
      }
    }
  }

  /**
   * Renders grouped grids (like Month Hours or Year Views).
   * @param {HTMLElement} container
   * @param {Array<{id: string|number, title?: string, dots: Array<{status: string, label: string}>}>} groups
   * @param {string} containerClass
   * @param {string} cardClass
   * @param {string} gridClass
   */
  static renderGrouped(container, groups, containerClass, cardClass, gridClass) {
    if (container.className !== containerClass) {
      container.className = containerClass;
      container.innerHTML = '';
    }

    const existingGroups = container.children;
    const requiredGroupsCount = groups.length;

    if (existingGroups.length !== requiredGroupsCount) {
      container.innerHTML = '';
      const fragment = document.createDocumentFragment();
      
      groups.forEach(g => {
        const card = document.createElement('div');
        card.className = cardClass;
        
        if (g.title) {
          const title = document.createElement('div');
          title.className = `${cardClass}-title`;
          title.textContent = g.title;
          card.appendChild(title);
        }

        const grid = document.createElement('div');
        grid.className = gridClass;
        
        g.dots.forEach(() => {
          const dot = document.createElement('div');
          dot.className = 'dot';
          grid.appendChild(dot);
        });

        card.appendChild(grid);
        fragment.appendChild(card);
      });
      
      container.appendChild(fragment);
    }

    // Diff and update dots inside the groups
    for (let gIndex = 0; gIndex < requiredGroupsCount; gIndex++) {
      const groupData = groups[gIndex];
      const cardElement = existingGroups[gIndex];
      const gridElement = cardElement.querySelector(`.${gridClass.split(' ')[0]}`);
      
      if (!gridElement) continue;
      
      const dotsData = groupData.dots;
      const dotElements = gridElement.children;

      for (let dIndex = 0; dIndex < dotsData.length; dIndex++) {
        const dotElement = dotElements[dIndex];
        const state = dotsData[dIndex];
        if (!dotElement) continue;

        let targetClass = 'dot';
        if (state.status === 'completed') {
          targetClass = 'dot completed';
        } else if (state.status === 'current') {
          targetClass = 'dot current';
        }
        
        if (dotElement.className !== targetClass) {
          dotElement.className = targetClass;
        }
        
        if (dotElement.getAttribute('aria-label') !== state.label) {
          dotElement.setAttribute('aria-label', state.label);
        }
        
        if (dotElement.getAttribute('role') !== 'img') {
          dotElement.setAttribute('role', 'img');
        }
      }
    }
  }

  /**
   * Updates SVG arc parameters cleanly without reconstruction.
   * @param {SVGPathElement} pathElement
   * @param {number} percentage (0-100)
   * @param {number} totalLength
   */
  static updateArc(pathElement, percentage, totalLength = 251.327) {
    if (!pathElement) return;
    const offset = totalLength - (percentage / 100) * totalLength;
    pathElement.style.strokeDashoffset = offset;
  }
}
