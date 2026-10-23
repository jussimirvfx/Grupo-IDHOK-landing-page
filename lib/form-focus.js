// A delayed CTA focus must yield to any field the visitor selects meanwhile.
export function focusFormAfterScroll(root, delay = 500) {
  const document = root?.ownerDocument;
  if (!document) return () => {};
  const origin = document.activeElement;
  const cancel = () => {
    clearTimeout(timer);
    document.removeEventListener('focusin', moved);
    document.removeEventListener('pointerdown', moved);
  };
  const moved = (event) => { if (event.target !== origin) cancel(); };
  const timer = setTimeout(() => {
    cancel();
    if (root.isConnected && document.activeElement === origin) root.querySelector('input')?.focus({ preventScroll: true });
  }, delay);
  document.addEventListener('focusin', moved);
  document.addEventListener('pointerdown', moved);
  return cancel;
}
