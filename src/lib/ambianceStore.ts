/**
 * ambianceStore — module-level singleton for ambient audio.
 *
 * The iframe is created once and lives on `document.body` for the
 * entire browser session. React components subscribe to this store
 * via `useSyncExternalStore`, so navigating away and back never
 * interrupts playback.
 */

export interface Sound {
  id: string;
  label: string;
  emoji: string;
  videoId: string;
}

export const SOUNDS: Sound[] = [
  { id: 'library',    label: 'Library',     emoji: '📚', videoId: 'nMfPqeZjc2c' },
  { id: 'coffee',     label: 'Coffee Shop', emoji: '☕', videoId: '2gliGzb2_1I' },
  { id: 'city',       label: 'City',        emoji: '🏙️', videoId: 'rPjez8z61os' },
  { id: 'forest',     label: 'Forest',      emoji: '🌲', videoId: 'xNN7iTA57jM' },
  { id: 'rain',       label: 'Rain',        emoji: '🌧️', videoId: 'nDq6TstdEi8' },
  { id: 'restaurant', label: 'Restaurant',  emoji: '🍽️', videoId: 't3s3VJ2WTRY' },
  { id: 'fireplace',  label: 'Fireplace',   emoji: '🔥', videoId: 'L_LUpnjgPso' },
  { id: 'ocean',      label: 'Ocean',       emoji: '🌊', videoId: 'WHPEKLQID4U' },
];

interface State {
  activeId: string | null;
  volume: number;
  loading: boolean;
}

let state: State = { activeId: null, volume: 70, loading: false };
let iframe: HTMLIFrameElement | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSnapshot(): State {
  return state;
}

function buildSrc(videoId: string): string {
  const origin = encodeURIComponent(window.location.origin);
  return [
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    `?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${videoId}`,
    `&iv_load_policy=3&disablekb=1&fs=0&rel=0&modestbranding=1&origin=${origin}`,
  ].join('');
}

function ytCmd(func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*'
  );
}

function destroyIframe() {
  if (!iframe) return;
  ytCmd('pauseVideo');
  iframe.src = 'about:blank';
  iframe.remove();
  iframe = null;
}

export function play(sound: Sound) {
  destroyIframe();
  state = { ...state, activeId: sound.id, loading: true };
  notify();

  const el = document.createElement('iframe');
  el.src = buildSrc(sound.videoId);
  el.allow = 'autoplay; encrypted-media';
  el.setAttribute('allowfullscreen', 'false');
  el.title = 'Ambiance audio';
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '-1px',
    right: '-1px',
    width: '1px',
    height: '1px',
    opacity: '0',
    pointerEvents: 'none',
    border: 'none',
  });

  el.onload = () => {
    state = { ...state, loading: false };
    notify();
    setTimeout(() => ytCmd('setVolume', [state.volume]), 1500);
  };

  document.body.appendChild(el);
  iframe = el;
}

export function stop() {
  destroyIframe();
  state = { ...state, activeId: null, loading: false };
  notify();
}

export function setVolume(val: number) {
  state = { ...state, volume: val };
  notify();
  ytCmd('setVolume', [val]);
}
