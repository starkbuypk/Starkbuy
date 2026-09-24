type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function toast(message: string, options: ToastOptions = {}): void {
  const { type = 'success', duration = 4000 } = options;
  const el = document.createElement('div');
  el.className = 'toast';

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const iconColor = type === 'success' ? 'var(--luna-1)' : type === 'error' ? '#C44830' : 'var(--luna-2)';

  const iconEl = document.createElement('span');
  iconEl.style.cssText = `color:${iconColor};margin-right:0.5rem;font-weight:600`;
  iconEl.textContent = icon;
  el.appendChild(iconEl);
  el.appendChild(document.createTextNode(message));
  getContainer().appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}
