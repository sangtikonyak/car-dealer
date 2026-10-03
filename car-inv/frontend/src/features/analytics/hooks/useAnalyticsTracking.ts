import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendAnalyticsEvent } from '../api';
import type { AnalyticsEventPayload, AnalyticsEventRequest } from '../types';

const visitorStorageKey = 'driva.analytics.visitor';
const sessionStorageKey = 'driva.analytics.session';
const sessionStartedKey = 'driva.analytics.session.started';
const sessionTimeoutMs = 30 * 60 * 1000;

const createIdentifier = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const readOrCreate = (key: string): string => {
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = createIdentifier();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return createIdentifier();
  }
};

const getSessionId = (): string => {
  try {
    const raw = window.localStorage.getItem(sessionStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; lastSeen?: number };
      if (parsed.id && parsed.lastSeen && Date.now() - parsed.lastSeen < sessionTimeoutMs) {
        window.localStorage.setItem(
          sessionStorageKey,
          JSON.stringify({ id: parsed.id, lastSeen: Date.now() }),
        );
        return parsed.id;
      }
    }
    const created = createIdentifier();
    window.localStorage.setItem(
      sessionStorageKey,
      JSON.stringify({ id: created, lastSeen: Date.now() }),
    );
    return created;
  } catch {
    return createIdentifier();
  }
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';
  if (window.innerWidth < 640) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
};

const send = async (payload: AnalyticsEventPayload): Promise<void> => {
  if (typeof window === 'undefined') return;
  const visitorId = readOrCreate(visitorStorageKey);
  const sessionId = getSessionId();
  const currentSessionMarker = window.sessionStorage.getItem(sessionStartedKey);
  if (currentSessionMarker !== sessionId) {
    window.sessionStorage.setItem(sessionStartedKey, sessionId);
    void sendAnalyticsEvent({
      eventType: 'SESSION_STARTED',
      route: window.location.pathname,
      visitorId,
      sessionId,
      deviceType: getDeviceType(),
    }).catch(() => undefined);
  }
  const request: AnalyticsEventRequest = {
    ...payload,
    visitorId,
    sessionId,
    deviceType: getDeviceType(),
    ...(document.referrer ? { referrer: document.referrer.slice(0, 500) } : {}),
  };
  await sendAnalyticsEvent(request);
};

export const trackAnalyticsEvent = (payload: AnalyticsEventPayload): void => {
  void send(payload).catch(() => undefined);
};

export const useAnalyticsTracking = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    trackAnalyticsEvent({
      eventType: 'PAGE_VIEWED',
      route: location.pathname,
    });
  }, [location.pathname]);

  return useCallback((payload: AnalyticsEventPayload) => trackAnalyticsEvent(payload), []);
};
