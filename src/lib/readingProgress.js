"use client";

import { useSyncExternalStore } from "react";

// Shared between the post page's ReadingProgress (which measures) and the
// Header (which hides on scroll down): while the header shows, the bar runs
// along the bottom of its pill; while it's tucked away, across the top of
// the screen. progress is null off post pages.
let state = { progress: null, headerHidden: false };
const listeners = new Set();

function set(patch) {
  const next = { ...state, ...patch };
  if (next.progress === state.progress && next.headerHidden === state.headerHidden) return;
  state = next;
  listeners.forEach((l) => l());
}

export const setReadingProgress = (progress) => set({ progress });
export const setHeaderHidden = (headerHidden) => set({ headerHidden });

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const server = { progress: null, headerHidden: false };

export const useReadingState = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => server,
  );
