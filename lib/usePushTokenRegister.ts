'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useIsApp } from './useIsApp';
import { registerPushToken } from './notificationApi';

declare global {
  interface Window {
    __PUSH_TOKEN__?: { token: string; platform: 'ios' | 'android' };
  }
}

export function usePushTokenRegister() {
  const isApp = useIsApp();
  const { data: session } = useSession();
  const registered = useRef(false);

  useEffect(() => {
    if (!isApp || !session?.user || registered.current) return;
    const info = window.__PUSH_TOKEN__;
    if (!info?.token) return;
    registered.current = true;
    registerPushToken(info).catch((err) => {
      console.error('[push-token-register]', err);
      registered.current = false;
    });
  }, [isApp, session]);
}
