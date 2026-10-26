import { AccountCard, AccountList, Button, Card } from '@inno-trec/ui-web';
import { useState } from 'react';
import { WALLETS } from '../data/sample';

/** Pattern: list on the left, detail on the right. On narrow screens the detail moves below the list. */
export function WalletsPage() {
  const [selectedId, setSelectedId] = useState(WALLETS[0].id);
  const selected = WALLETS.find((wallet) => wallet.id === selectedId) ?? WALLETS[0];

  return (
    <div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card title="All wallets" subtitle="Choose a wallet to see its record" flush>
        <AccountList wallets={WALLETS} selectedId={selectedId} onSelect={(wallet) => setSelectedId(wallet.id)} />
      </Card>

      <AccountCard
        member={{
          name: selected.name,
          role: selected.role,
          status: selected.status,
          wallets: [{ id: selected.id, type: selected.type, balance: selected.balance, status: selected.status }],
        }}
        actions={[
          <Button key="history" size="sm">
            History
          </Button>,
          <Button key="suspend" size="sm" variant="danger">
            Suspend
          </Button>,
        ]}
      />
    </div>
  );
}
