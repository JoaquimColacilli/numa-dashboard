import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

const EN_CASTELLANO = ['es-AR', 'es'] as const;
Object.defineProperty(navigator, 'languages', { configurable: true, get: () => EN_CASTELLANO });
Object.defineProperty(navigator, 'language', { configurable: true, get: () => EN_CASTELLANO[0] });
document.documentElement.lang = 'es-AR';

Object.assign(HTMLDialogElement.prototype, {
  showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
  close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  },
});

if (!('setPointerCapture' in Element.prototype)) {
  Object.assign(Element.prototype, {
    setPointerCapture: () => undefined,
    releasePointerCapture: () => undefined,
    hasPointerCapture: () => false,
  });
}

afterEach(() => {
  cleanup();
});
