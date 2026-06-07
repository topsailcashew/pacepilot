/**
 * ambianceStore.test.ts
 *
 * Tests pure-state transitions (getSnapshot, play, stop).
 * The iframe DOM interactions are mocked — we only care about
 * the state machine, not actual YouTube embedding.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSnapshot, play, stop, SOUNDS } from './ambianceStore';

// ── DOM mocks ─────────────────────────────────────────────────────────────────

const mockIframe = {
  src: '',
  allow: '',
  title: '',
  style: {} as CSSStyleDeclaration,
  setAttribute: vi.fn(),
  remove: vi.fn(),
  onload: null as (() => void) | null,
  contentWindow: {
    postMessage: vi.fn(),
  },
};

beforeEach(() => {
  // Reset iframe mock state
  mockIframe.src = '';
  mockIframe.remove.mockClear();
  mockIframe.contentWindow.postMessage.mockClear();

  vi.spyOn(document, 'createElement').mockReturnValue(mockIframe as unknown as HTMLIFrameElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockIframe as unknown as HTMLIFrameElement);

  // Reset module state by calling stop()
  stop();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getSnapshot initial state', () => {
  it('starts with activeId null and loading false', () => {
    const state = getSnapshot();
    expect(state.activeId).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('starts with volume 70', () => {
    const state = getSnapshot();
    expect(state.volume).toBe(70);
  });
});

describe('play()', () => {
  it('sets activeId to the selected sound id', () => {
    const sound = SOUNDS[0];
    play(sound);
    expect(getSnapshot().activeId).toBe(sound.id);
  });

  it('sets loading to true immediately after play()', () => {
    play(SOUNDS[0]);
    expect(getSnapshot().loading).toBe(true);
  });

  it('creates an iframe element', () => {
    play(SOUNDS[0]);
    expect(document.createElement).toHaveBeenCalledWith('iframe');
  });

  it('appends the iframe to document.body', () => {
    play(SOUNDS[0]);
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('switches sounds when a different sound is played while one is active', () => {
    play(SOUNDS[0]);
    play(SOUNDS[1]);
    expect(getSnapshot().activeId).toBe(SOUNDS[1].id);
  });
});

describe('stop()', () => {
  it('sets activeId to null', () => {
    play(SOUNDS[0]);
    stop();
    expect(getSnapshot().activeId).toBeNull();
  });

  it('sets loading to false', () => {
    play(SOUNDS[0]);
    stop();
    expect(getSnapshot().loading).toBe(false);
  });
});

describe('SOUNDS', () => {
  it('has at least one sound', () => {
    expect(SOUNDS.length).toBeGreaterThan(0);
  });

  it('each sound has required fields', () => {
    SOUNDS.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.emoji).toBeTruthy();
      expect(s.videoId).toBeTruthy();
    });
  });
});
