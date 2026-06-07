import { describe, it, expect } from 'vitest';
import { fmtDuration } from './fmt';

describe('fmtDuration', () => {
  it('formats zero seconds as 00:00', () => {
    expect(fmtDuration(0)).toBe('00:00');
  });

  it('formats seconds only (< 60s)', () => {
    expect(fmtDuration(45)).toBe('00:45');
  });

  it('formats minutes and seconds', () => {
    expect(fmtDuration(90)).toBe('01:30');
  });

  it('formats 59:59 correctly', () => {
    expect(fmtDuration(3599)).toBe('59:59');
  });

  it('includes hours when >= 3600 seconds', () => {
    expect(fmtDuration(3600)).toBe('01:00:00');
  });

  it('formats 1h 30m 15s correctly', () => {
    expect(fmtDuration(5415)).toBe('01:30:15');
  });

  it('pads single-digit values with leading zeros', () => {
    expect(fmtDuration(61)).toBe('01:01');
    expect(fmtDuration(3661)).toBe('01:01:01');
  });
});
