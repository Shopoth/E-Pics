(function () {
  window.uiHelpers = {
    showToast(message, type = 'info', timeout = 3000) {
      let toast = document.getElementById('epics-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'epics-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-60 opacity-0 transition-all duration-300 pointer-events-none';
        toast.innerHTML = '<div id="epics-toast-inner" class="rounded-2xl px-4 py-3 text-sm font-medium"></div>';
        document.body.appendChild(toast);
      }
      const inner = document.getElementById('epics-toast-inner');
      inner.textContent = message;
      inner.style.background = type === 'error' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : type === 'success' ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#6366f1,#7c3aed)';
      inner.style.color = '#fff';
      toast.classList.remove('opacity-0');
      toast.classList.add('pointer-events-auto');
      setTimeout(() => {
        toast.classList.add('opacity-0');
        toast.classList.remove('pointer-events-auto');
      }, timeout);
    },

    trapFocus(modal) {
      if (!modal) return () => {};
      const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]';
      const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
      if (focusable.length === 0) {
        // focus modal container itself
        modal.tabIndex = -1;
        modal.focus();
      }

      function keyHandler(e) {
        if (e.key === 'Escape') {
          // dispatch a custom event so page code can close modal
          modal.dispatchEvent(new CustomEvent('ui:escape'));
        }
        if (e.key === 'Tab') {
          const focusableNow = Array.from(modal.querySelectorAll(focusableSelector)).filter(el => !el.disabled && (el.offsetWidth > 0 || el.offsetHeight > 0));
          if (focusableNow.length === 0) {
            e.preventDefault();
            return;
          }
          const first = focusableNow[0];
          const last = focusableNow[focusableNow.length - 1];
          if (!modal.contains(document.activeElement)) {
            first.focus();
            e.preventDefault();
            return;
          }
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }

      document.addEventListener('keydown', keyHandler);
      return () => document.removeEventListener('keydown', keyHandler);
    }
  };
})();
