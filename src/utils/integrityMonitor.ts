/**
 * CLUE QUEST — Participant Integrity & Activity Monitor
 * Best-effort detection & non-destructive event logging.
 *
 * Events monitored:
 * - TAB_SWITCH / PAGE_HIDDEN (via Page Visibility API)
 * - WINDOW_BLUR (with debounce cooldown)
 * - FULLSCREEN_EXIT
 * - COPY_ATTEMPT (disabled on questions/clues, preserves answer input editing)
 * - PASTE_ATTEMPT (monitored and blocked during active test)
 * - CONTEXT_MENU (right-click prevention during active test)
 * - DEVTOOLS_HEURISTIC (best-effort dimension checks)
 */

import { request } from './api.js';

export type IntegrityEventType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS_HEURISTIC'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CONTEXT_MENU';

export interface IntegrityListenerCallbacks {
  onViolation?: (type: IntegrityEventType, message: string) => void;
  onFullscreenExit?: () => void;
}

let isInitialized = false;
let violationCount = 0;
let lastReportedTime: Record<string, number> = {};
const DEBOUNCE_COOLDOWN_MS = 1500; // 1.5s debounce for blur / visibility bursts

async function sendIntegrityReport(type: IntegrityEventType, metadata: Record<string, any> = {}) {
  const now = Date.now();
  const lastTime = lastReportedTime[type] || 0;

  // Debounce rapid duplicate events
  if (now - lastTime < DEBOUNCE_COOLDOWN_MS) {
    return;
  }
  lastReportedTime[type] = now;
  violationCount++;

  try {
    await request('/game/integrity-event', {
      method: 'POST',
      body: JSON.stringify({
        type,
        metadata: {
          ...metadata,
          violationIndex: violationCount,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    // Non-blocking catch to ensure test gameplay is never interrupted
    console.warn(`[IntegrityMonitor] Failed to sync ${type}:`, err);
  }
}

export function setupIntegrityMonitor(callbacks: IntegrityListenerCallbacks = {}) {
  if (typeof window === 'undefined') return () => {};

  // 1. Tab Switch / Page Visibility
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      sendIntegrityReport('TAB_SWITCH', { visibilityState: 'hidden' });
      callbacks.onViolation?.('TAB_SWITCH', 'You left the active test window. Your activity has been recorded.');
    }
  };

  // 2. Window Blur / Focus
  const handleBlur = () => {
    sendIntegrityReport('WINDOW_BLUR', { reason: 'window_blur' });
    callbacks.onViolation?.('WINDOW_BLUR', 'Test window lost focus.');
  };

  // 3. Fullscreen Change / Exit Detection
  const handleFullscreenChange = () => {
    const isFullscreen = Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFullscreen) {
      sendIntegrityReport('FULLSCREEN_EXIT', { reason: 'user_exit_fullscreen' });
      callbacks.onFullscreenExit?.();
      callbacks.onViolation?.('FULLSCREEN_EXIT', 'Fullscreen mode exited. Please return to fullscreen.');
    }
  };

  // 4. Copy Prevention (Allow normal input typing/editing, block question/clue text copying)
  const handleCopy = (e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isAnswerInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    // If copying from outside answer field (e.g. question/clue text)
    if (!isAnswerInput) {
      e.preventDefault();
      sendIntegrityReport('COPY_ATTEMPT', { targetTag: target?.tagName || 'UNKNOWN' });
      callbacks.onViolation?.('COPY_ATTEMPT', 'Copying question or clue text is disabled during the test.');
    }
  };

  // 5. Paste Prevention on Answer Input
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    sendIntegrityReport('PASTE_ATTEMPT', { target: (e.target as HTMLElement)?.tagName || 'INPUT' });
    callbacks.onViolation?.('PASTE_ATTEMPT', 'Paste is disabled during the competition. Please type your answer.');
  };

  // 6. Right-Click Context Menu Prevention
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    sendIntegrityReport('CONTEXT_MENU', { x: e.clientX, y: e.clientY });
    callbacks.onViolation?.('CONTEXT_MENU', 'Right-click context menu is disabled in the test arena.');
  };

  // 7. Best-Effort DevTools Detection Heuristic (Non-Destructive)
  let devToolsInterval: any = null;
  const checkDevTools = () => {
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;

    // A threshold of 200px accounts for window frames while catching open side/bottom panels
    if (widthGap > 220 || heightGap > 220) {
      sendIntegrityReport('DEVTOOLS_HEURISTIC', { widthGap, heightGap });
    }
  };

  // Attach Listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleBlur);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('copy', handleCopy);
  document.addEventListener('paste', handlePaste);
  document.addEventListener('contextmenu', handleContextMenu);

  devToolsInterval = setInterval(checkDevTools, 5000);

  // Return Cleanup Function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('paste', handlePaste);
    document.removeEventListener('contextmenu', handleContextMenu);
    if (devToolsInterval) clearInterval(devToolsInterval);
  };
}
