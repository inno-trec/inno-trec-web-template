import { Button, Card, InlineAlert, TransactionList, WalletBalance } from '@inno-trec/ui-web';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getMyWallet, type MyWallet } from '../data/api';

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; wallet: MyWallet };

/**
 * Pattern: a member screen with several blocks, and the three states of data from a backend.
 * Member screens use plain words (credits, never EC or wallet IDs), large controls and one primary button.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function MyWalletPage() {
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after the page has closed
    setLoad({ state: 'loading' });
    getMyWallet().then(
      (wallet) => current && setLoad({ state: 'ready', wallet }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  // Loading: say what is loading. role="status" lets screen readers announce it.
  if (load.state === 'loading') {
    return (
      <div className="max-w-[640px]">
        <Card>
          <p role="status" className="m-0 text-ink-muted">
            Loading your credits…
          </p>
        </Card>
      </div>
    );
  }

  // Error: say what failed and give one way forward.
  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="Your credits could not be loaded">
          Check your connection and try again. Nothing in your wallet has changed.
        </InlineAlert>
        <div>
          <Button variant="primary" size="lg" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const { wallet } = load;
  return (
    <div className="flex max-w-[640px] flex-col gap-space-4">
      {/* WalletBalance already looks like a card. Do not put it inside another Card. */}
      <WalletBalance
        balance={wallet.balance}
        updated={wallet.updated}
        actions={
          <Button variant="primary" size="lg" onClick={() => navigate('/send')}>
            Send credits
          </Button>
        }
      />

      {/* Empty: TransactionList shows emptyText when there are no movements. */}
      <Card title="Recent activity" flush>
        <TransactionList
          transactions={wallet.movements}
          emptyText="No activity yet. Credits you receive or send will appear here."
        />
      </Card>
    </div>
  );
}
