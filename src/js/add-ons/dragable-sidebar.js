(function() {
    "use strict";
    
    if (pageurl.includes("#login-tab") || pageurl.includes("#register-tab")) return; // Don't run on login page

    const MENU_SELECTOR = '.page-sidebar-menu';
    const ORDER_KEY = 'SHKOLOTWEAKS_SIDEBAR_ORDER_OVERRIDE';
    const DRAG_ICON_CLASS = 'fas fa-grip-lines';
    
    const style = document.createElement('style');
    style.textContent = `
      ${MENU_SELECTOR} {
        position: relative;
        z-index: 9999;
        min-height: 150px;
      }
      .drag-mode-on > li.draggable {
        cursor: move;
      }
      .dragging {
        opacity: 0.5;
      }
      .drop-target {
        outline: 2px dashed #999;
      }
      .placeholder {
        border: 2px dotted #999;
        margin: 4px 0;
        height: 40px;
        background: transparent;
        pointer-events: none;
      }
      .pill-indicator {
        display: inline-block;
        padding: 2px 8px;
        background-color: #ccc;
        color: #fff;
        font-size: 0.8em;
        margin-left: 5px;
        transition: background-color 0.3s;
        border-radius: 20px !important;
      }
      .pill-indicator.on {
        background-color: #4caf50;
      }
      .pill-indicator.off {
        background-color: #f44336;
      }
      #sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 9998;
        pointer-events: none;
        transition: opacity 0.5s ease;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
    
    const menu = document.querySelector(MENU_SELECTOR);
    if (!menu) return;
    
    const toggleLi = document.createElement('li');
    toggleLi.className = 'nav-item';
    toggleLi.id = 'dragModeToggleItem';
    toggleLi.innerHTML = `
      <a href="javascript:" class="nav-link">
        <i class="${DRAG_ICON_CLASS}"></i>
        <span class="title">
          ${chrome.i18n.getMessage("reordermode")}
          <span id="dragModeStatus" class="pill-indicator off">
            <i class="fas fa-toggle-off"></i>
          </span>
        </span>
      </a>
    `;
    menu.insertBefore(toggleLi, menu.firstElementChild);
    
    function getTopLevelLis() {
      return Array.from(menu.querySelectorAll(':scope > li'))
        .filter(li => li !== toggleLi && !li.classList.contains('placeholder'));
    }
    
    function getItemId(li) {
      return li.dataset.originalIconClass || li.id || li.textContent.trim();
    }
    
    getTopLevelLis().forEach(li => {
      let aElem = li.querySelector('a.nav-link') || li.querySelector('a');
      let icon = aElem ? aElem.querySelector('i') : null;
      if (icon) {
        li.dataset.originalIconClass = icon.className;
      } else {
        li.dataset.originalIconClass = li.id || li.textContent.trim();
      }
    });
    
    try {
      const stored = localStorage.getItem(ORDER_KEY);
      if (stored) {
        const savedOrder = JSON.parse(stored);
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          const currentLis = getTopLevelLis();
          const liMap = {};
          currentLis.forEach(li => { liMap[getItemId(li)] = li; });
          savedOrder.forEach(savedId => {
            if (liMap[savedId]) menu.appendChild(liMap[savedId]);
          });
          currentLis.forEach(li => {
            const id = getItemId(li);
            if (!savedOrder.includes(id)) {
              menu.appendChild(li);
            }
          });
        }

        console.log('Sidebar order restored from localStorage:', savedOrder);
      }
    } catch (e) {
      console.error('Error reading saved order', e);
    }
    
    const placeholder = document.createElement('li');
    placeholder.className = 'placeholder';
    
    function handleDragStart(e) {
      e.dataTransfer.effectAllowed = 'move';
      const ghost = document.createElement('div');
      ghost.style.width = e.currentTarget.offsetWidth + 'px';
      ghost.style.height = e.currentTarget.offsetHeight + 'px';
      ghost.style.border = '2px dotted #999';
      ghost.style.backgroundColor = 'transparent';
      ghost.style.boxSizing = 'border-box';
      ghost.style.position = 'absolute';
      ghost.style.top = '-9999px';
      ghost.style.left = '-9999px';
      document.body.appendChild(ghost);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setDragImage(ghost, offsetX, offsetY);
      e.currentTarget.classList.add('dragging');
      e.currentTarget.__dragGhost = ghost;
      e.dataTransfer.setData('text/plain', getItemId(e.currentTarget));
    }
    
    function handleDragEnd(e) {
      e.currentTarget.classList.remove('dragging');
      if (e.currentTarget.__dragGhost) {
        document.body.removeChild(e.currentTarget.__dragGhost);
        delete e.currentTarget.__dragGhost;
      }
      getTopLevelLis().forEach(li => li.classList.remove('drop-target'));
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    }
    
    function updatePlaceholderPosition(e, target) {
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      if (offsetY < rect.height / 2) {
        target.parentNode.insertBefore(placeholder, target);
      } else {
        target.parentNode.insertBefore(placeholder, target.nextSibling);
      }
    }
    
    function handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      updatePlaceholderPosition(e, e.currentTarget);
      e.currentTarget.classList.add('drop-target');
    }
    
    function handleDragLeave(e) {
      e.currentTarget.classList.remove('drop-target');
    }
    
    function handleDrop(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.remove('drop-target');
      const draggedId = e.dataTransfer.getData('text/plain');
      const draggedLi = getTopLevelLis().find(li => getItemId(li) === draggedId);
      if (draggedLi && draggedLi !== placeholder) {
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(draggedLi, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else {
          menu.insertBefore(draggedLi, e.currentTarget);
        }
        saveOrder();
      }
    }
    
    function updatePlaceholderByContainer(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const mouseY = e.clientY;
      const items = getTopLevelLis();
      let inserted = false;
      for (const li of items) {
        const rect = li.getBoundingClientRect();
        if (mouseY < rect.top + rect.height / 2) {
          if (placeholder.parentNode !== menu || placeholder.nextSibling !== li) {
            menu.insertBefore(placeholder, li);
          }
          inserted = true;
          break;
        }
      }
      if (!inserted && placeholder.parentNode !== menu) {
        menu.appendChild(placeholder);
      }
    }
    
    menu.addEventListener('dragenter', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    menu.addEventListener('dragover', function(e) {
      if (e.target === menu) {
        updatePlaceholderByContainer(e);
      }
    });
    
    menu.addEventListener('drop', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const draggedId = e.dataTransfer.getData('text/plain');
      const draggedLi = getTopLevelLis().find(li => getItemId(li) === draggedId);
      if (draggedLi) {
        if (placeholder.parentNode) {
          placeholder.parentNode.insertBefore(draggedLi, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else {
          menu.appendChild(draggedLi);
        }
        saveOrder();
      }
    });
    
    let dragModeEnabled = false;
    function setDragMode(enabled) {
      dragModeEnabled = enabled;
      const statusEl = document.getElementById('dragModeStatus');
      if (enabled) {
        menu.classList.add('drag-mode-on');
        if (statusEl) {
          statusEl.innerHTML = '<i class="fas fa-toggle-on"></i>';
          statusEl.classList.remove('off');
          statusEl.classList.add('on');
        }
        let overlay = document.getElementById('sidebar-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'sidebar-overlay';
          document.body.appendChild(overlay);
          overlay.offsetHeight;
          overlay.style.opacity = '1';
        }
      } else {
        menu.classList.remove('drag-mode-on');
        if (statusEl) {
          statusEl.innerHTML = '<i class="fas fa-toggle-off"></i>';
          statusEl.classList.remove('on');
          statusEl.classList.add('off');
        }
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.addEventListener('transitionend', function() {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, { once: true });
        }
        if (placeholder.parentNode) {
          placeholder.parentNode.removeChild(placeholder);
        }
      }
      const lis = getTopLevelLis();
      lis.forEach(li => {
        li.draggable = enabled;
        li.classList.toggle('draggable', enabled);
        let aElem = li.querySelector('a.nav-link') || li.querySelector('a');
        const icon = aElem ? aElem.querySelector('i') : null;
        if (enabled) {
          if (icon) icon.className = DRAG_ICON_CLASS;
          li.addEventListener('dragstart', handleDragStart);
          li.addEventListener('dragend', handleDragEnd);
          li.addEventListener('dragover', handleDragOver);
          li.addEventListener('dragleave', handleDragLeave);
          li.addEventListener('drop', handleDrop);
  
          // Disable click actions
          li.addEventListener('click', preventClick, true);
        } else {
          if (icon) icon.className = li.dataset.originalIconClass;
          li.removeEventListener('dragstart', handleDragStart);
          li.removeEventListener('dragend', handleDragEnd);
          li.removeEventListener('dragover', handleDragOver);
          li.removeEventListener('dragleave', handleDragLeave);
          li.removeEventListener('drop', handleDrop);
  
          // Re-enable click actions
          li.removeEventListener('click', preventClick, true);
        }
      });
    }
  
    function preventClick(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    function saveOrder() {
      const order = getTopLevelLis().map(li => getItemId(li));
      try {
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
      } catch (e) {
        console.error('Error saving order', e);
      }
    }
    
    setDragMode(false);
    
    toggleLi.addEventListener('click', function(e) {
      e.preventDefault();
      setDragMode(!dragModeEnabled);
    });
  })();
  