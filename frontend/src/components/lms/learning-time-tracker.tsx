'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

const HEARTBEAT_MS = 15_000;
const IDLE_MS = 60_000;

export function LearningTimeTracker({
  lessonId,
  mode,
  videoPlaying = false,
  flushRef,
}: {
  lessonId: string;
  mode: 'text' | 'video';
  videoPlaying?: boolean;
  flushRef: MutableRefObject<(() => Promise<void>) | null>;
}) {
  const sessionKey = useRef('');
  const sequence = useRef(0);
  const lastActivity = useRef(0);
  const videoPlayingRef = useRef(videoPlaying);

  useEffect(() => {
    videoPlayingRef.current = videoPlaying;
  }, [videoPlaying]);

  useEffect(() => {
    sessionKey.current = crypto.randomUUID();
    sequence.current = 0;
    lastActivity.current = 0;

    const payload = () => ({
      sessionKey: sessionKey.current,
      lessonId,
      sequence: sequence.current++,
    });
    const eligible = () => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return false;
      return mode === 'video'
        ? videoPlayingRef.current
        : Date.now() - lastActivity.current <= IDLE_MS;
    };
    const heartbeat = async () => {
      if (!eligible()) return;
      await fetch('/api/learning-time/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
        keepalive: true,
      });
    };
    flushRef.current = heartbeat;
    const noteActivity = () => {
      const wasIdle = Date.now() - lastActivity.current > IDLE_MS;
      lastActivity.current = Date.now();
      if (mode === 'text' && wasIdle) void heartbeat();
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    if (mode === 'text') {
      for (const event of events) window.addEventListener(event, noteActivity, { passive: true });
    }
    if (mode === 'video' && videoPlayingRef.current) void heartbeat();
    const interval = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);
    const onPageHide = () => {
      if (!eligible()) return;
      navigator.sendBeacon(
        '/api/learning-time/heartbeat',
        new Blob([JSON.stringify(payload())], { type: 'application/json' })
      );
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.clearInterval(interval);
      flushRef.current = null;
      window.removeEventListener('pagehide', onPageHide);
      for (const event of events) window.removeEventListener(event, noteActivity);
    };
  }, [flushRef, lessonId, mode]);

  return null;
}
