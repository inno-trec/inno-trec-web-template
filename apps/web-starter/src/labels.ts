import type { ExampleRecord } from './data/types';

/*
 * Words and tones for the codes the API sends. Status always shows a word with its color.
 * Keep the words here, so every page says the same thing.
 */

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export const RECORD_STATUS: Record<ExampleRecord['status'], { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  paused: { tone: 'neutral', label: 'Paused' },
};
