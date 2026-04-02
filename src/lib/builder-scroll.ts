export const BUILDER_SCROLL_TARGET = 'builder-prompt';

const BUILDER_SCROLL_STORAGE_KEY = 'shipstack-scroll-target';

export function markBuilderScrollTarget(target = BUILDER_SCROLL_TARGET) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(BUILDER_SCROLL_STORAGE_KEY, target);
}

export function consumeBuilderScrollTarget() {
  if (typeof window === 'undefined') {
    return null;
  }

  const target = window.sessionStorage.getItem(BUILDER_SCROLL_STORAGE_KEY);

  if (target) {
    window.sessionStorage.removeItem(BUILDER_SCROLL_STORAGE_KEY);
  }

  return target;
}
