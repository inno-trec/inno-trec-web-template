import { Card, TransferForm, type FlowStatus } from '@inno-trec/ui-web';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RECIPIENTS } from '../data/sample';

const AVAILABLE = 350; // from the backend

/**
 * Pattern: a short step flow in a single column, at most 480px wide.
 * TransferForm collects the input and shows progress. You drive it with `status`:
 * idle -> working (request sent) -> done or error (backend answered).
 */
export function SendCreditsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [sent, setSent] = useState(0);
  const [errorCode, setErrorCode] = useState<string | undefined>();

  function handleSubmit({ to, amount, note }: { to: string; amount: number; note: string }) {
    setStatus('working');
    setErrorCode(undefined);
    // TODO: replace this timer with your API call, for example:
    //   api.transfers.create({ to, amount, note }).then(() => setStatus('done')).catch(...)
    void to;
    void note;
    window.setTimeout(() => {
      setSent(amount);
      setStatus('done');
    }, 800);
  }

  return (
    <div className="max-w-[480px]">
      <Card>
        <TransferForm
          recipients={RECIPIENTS}
          available={AVAILABLE}
          status={status}
          errorCode={errorCode}
          newBalance={AVAILABLE - sent}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
          onFinish={() => navigate('/')}
          onReset={() => setStatus('idle')}
          finishLabel="Back to overview"
        />
      </Card>
    </div>
  );
}
