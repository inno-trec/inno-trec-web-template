import type { Alert, Asset } from '@inno-trec/api-contract';

/*
 * Words and tones for the codes the API sends. Status always shows a word with its color.
 * Keep the words here, so every page says the same thing.
 */

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export const ASSET_TYPE: Record<Asset['type'], string> = {
  pv_system: 'PV system',
  inverter: 'Inverter',
  battery: 'Battery',
  meter: 'Meter',
};

export const ASSET_STATUS: Record<Asset['status'], { tone: Tone; label: string }> = {
  running: { tone: 'success', label: 'Running' },
  attention: { tone: 'warning', label: 'Needs attention' },
  fault: { tone: 'danger', label: 'Fault' },
  offline: { tone: 'neutral', label: 'Offline' },
};

export const ALERT_SEVERITY: Record<Alert['severity'], { tone: Tone; alertTone: 'info' | 'warning' | 'error'; label: string }> = {
  critical: { tone: 'danger', alertTone: 'error', label: 'Critical' },
  warning: { tone: 'warning', alertTone: 'warning', label: 'Warning' },
  info: { tone: 'info', alertTone: 'info', label: 'Information' },
};

export const ALERT_STATE: Record<Alert['state'], { tone: Tone; label: string }> = {
  new: { tone: 'warning', label: 'New' },
  acknowledged: { tone: 'info', label: 'Acknowledged' },
  resolved: { tone: 'success', label: 'Resolved' },
};

export const ALERT_KIND: Record<Alert['kind'], string> = {
  corrective: 'Corrective',
  predictive: 'Predictive',
};
