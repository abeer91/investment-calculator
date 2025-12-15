import '@testing-library/jest-dom/vitest';
import { afterAll } from 'vitest';

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined') {
  window.ResizeObserver = window.ResizeObserver || ResizeObserver;
}
global.ResizeObserver = global.ResizeObserver || ResizeObserver;

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
const originalClientWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'clientWidth',
);
const originalClientHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'clientHeight',
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetWidth',
);
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'offsetHeight',
);
const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    width: 1024,
    height: 768,
    top: 0,
    left: 0,
    bottom: 768,
    right: 1024,
  };
};

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  value: 1024,
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  value: 768,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 1024,
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 768,
});

afterAll(() => {
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

  if (originalClientWidth) {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
  } else {
    delete HTMLElement.prototype.clientWidth;
  }

  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
  } else {
    delete HTMLElement.prototype.clientHeight;
  }

  if (originalOffsetWidth) {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
  } else {
    delete HTMLElement.prototype.offsetWidth;
  }

  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  } else {
    delete HTMLElement.prototype.offsetHeight;
  }

  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

const swallowChartWarning = (message) =>
  typeof message === 'string' &&
  message.includes('The width(-1) and height(-1) of chart should be greater than 0');

console.error = (...args) => {
  if (
    args.length > 0 &&
    swallowChartWarning(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (
    args.length > 0 &&
    swallowChartWarning(args[0])
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
