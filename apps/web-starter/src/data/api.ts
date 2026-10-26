import type { Movement } from '@inno-trec/ui-web';
import { MY_MOVEMENTS, MY_WALLET } from './sample';

/**
 * FAKE BACKEND. It stands in for your API client while you build the interface.
 * Replace each function with a real request and keep the shapes: the backend computes every
 * balance, and the interface only displays what comes back.
 *
 * To see the other states without a backend, add one of these to the address:
 *   ?demo=empty   a new member with no activity
 *   ?demo=error   every request fails
 */

/** A refusal from the backend. `code` is the backend error code, for example INSUFFICIENT_BALANCE. */
export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export interface MyWallet {
  balance: number;
  available: number;
  /** Already formatted, for example "today at 08:00". */
  updated: string;
  movements: Movement[];
}

function demo() {
  return new URLSearchParams(window.location.search).get('demo');
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function getMyWallet(): Promise<MyWallet> {
  await delay(600);
  if (demo() === 'error') throw new ApiError('UNAVAILABLE');
  if (demo() === 'empty') return { balance: 0, available: 0, updated: MY_WALLET.updated, movements: [] };
  return { ...MY_WALLET, movements: MY_MOVEMENTS };
}

export async function sendCredits(input: { to: string; amount: number; note: string }): Promise<{ newBalance: number }> {
  await delay(800);
  // The form already checks the amount against `available`. The backend can still refuse,
  // for example when the balance changed after the page loaded.
  if (demo() === 'error') throw new ApiError('INSUFFICIENT_BALANCE');
  // This subtraction stands in for the backend. A real interface reads newBalance from the response.
  return { newBalance: MY_WALLET.balance - input.amount };
}
