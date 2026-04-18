'use client';

import { useSyncExternalStore } from 'react';

function getSnapshot() {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('ForYouthApp');
}

function getServerSnapshot() {
  return false;
}

const subscribe = () => () => {};

export function useIsApp() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
