export type PendingNav = { webUrl: string } | null;

let _pending: PendingNav = null;
const _listeners = new Set<(nav: PendingNav) => void>();

export function setPendingNav(nav: PendingNav) {
  _pending = nav;
  _listeners.forEach(fn => fn(nav));
}

export function subscribePendingNav(fn: (nav: PendingNav) => void) {
  _listeners.add(fn);
  if (_pending) {
    const nav = _pending;
    _pending = null;
    fn(nav);
  }
  return () => { _listeners.delete(fn); };
}
