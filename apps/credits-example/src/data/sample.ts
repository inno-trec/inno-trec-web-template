import type { Movement, Recipient, WalletRow } from '@inno-trec/ui-web';

/**
 * SAMPLE DATA. Replace it with calls to your backend.
 * The design system only displays what the backend reports: credit amounts, balances and
 * statuses come from the API. Never compute valuations in the interface.
 */

export interface LedgerRow {
  id: string;
  type: string;
  from: string;
  to: string;
  amount: number;
  when: string;
}

export const LEDGER: LedgerRow[] = [
  { id: 'l3', type: 'CONSUMPTION', from: 'C4', to: 'Community wallet', amount: 67, when: 'Today' },
  { id: 'l2', type: 'TRANSFER_P2P', from: 'C3', to: 'C4', amount: 200, when: 'Today' },
  { id: 'l1', type: 'ISSUANCE', from: 'Community wallet', to: 'C3', amount: 350, when: 'Earlier' },
];

export const WALLETS: WalletRow[] = [
  { id: 'w-3b91c0e7', name: 'C3', role: 'Prosumer, 3 kWp PV', type: 'MEMBER', balance: 150, status: 'ACTIVE' },
  { id: 'w-7d2e91b4', name: 'C4', role: 'Consumer, no PV', type: 'MEMBER', balance: 133, status: 'ACTIVE' },
  { id: 'w-community', name: 'Community', role: '100 members, 30 kWp', type: 'COMMUNITY', balance: -10233, status: 'ACTIVE' },
];

export const RECIPIENTS: Recipient[] = [
  { id: 'w-7d2e91b4', name: 'C4', detail: 'Same community' },
  { id: 'w-9a31c5f0', name: 'Member C7', detail: 'Same community' },
  { id: 'w-4b8e27d1', name: 'Member C12', detail: 'Same community', disabled: true },
];

/** The signed-in member's wallet, as the backend reports it (member C3 in user story 4). */
export const MY_WALLET = { balance: 150, available: 150, updated: 'today at 08:00' };

/** The same wallet's movements, newest first. Amounts are positive; `direction` gives the sign. */
export const MY_MOVEMENTS: Movement[] = [
  { id: 'm2', direction: 'out', txType: 'TRANSFER_P2P', amount: 200, time: 'Today', counterpartyName: 'C4' },
  { id: 'm1', direction: 'in', txType: 'ISSUANCE', purposeCode: 'GEN_SOLAR', amount: 350, time: 'Earlier' },
];
