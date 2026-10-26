import { Button, Card, DataTable, StatTile, type Column } from '@inno-trec/ui-web';
import { useNavigate } from 'react-router';
import { LEDGER, type LedgerRow } from '../data/sample';

const COLUMNS: Column<LedgerRow>[] = [
  { key: 'type', header: 'Type' },
  { key: 'from', header: 'Debited' },
  { key: 'to', header: 'Credited' },
  { key: 'amount', header: 'Amount (EC)', align: 'right', render: (row) => row.amount.toLocaleString('en-US') },
  { key: 'when', header: 'When' },
];

/** Pattern: headline numbers on top, then a table inside a flush Card. */
export function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-space-4">
      {/* StatTile rows: two to four tiles. Accent follows the theme: green energy, light-blue wallets, orange activity. */}
      <div className="grid gap-space-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Members" value={100} accent="orange" />
        <StatTile label="Installed capacity" value={30} unit="kWp" accent="green" />
        <StatTile label="Production this month" value={3000} unit="kWh" accent="green" />
        <StatTile label="Community wallet" value={-10233} unit="EC" accent="light-blue" />
      </div>

      {/* A table in a Card: set `flush` so rows run edge to edge, and leave the DataTable caption out. */}
      <Card
        title="Latest ledger entries"
        subtitle="Entries are final once recorded"
        flush
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/wallets')}>
            Open wallets
          </Button>
        }
      >
        <DataTable columns={COLUMNS} rows={LEDGER} rowKey="id" />
      </Card>
    </div>
  );
}
