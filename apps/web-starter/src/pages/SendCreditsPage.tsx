import { Card, TransferForm, type FlowStatus } from '@inno-trec/ui-web';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, sendCredits } from '../data/api';
import { MY_WALLET, RECIPIENTS } from '../data/sample';

/**
 * Pattern: a short step flow in a single column, at most 480px wide.
 * TransferForm collects the input and shows progress. You drive it with `status`:
 * idle -> working (request sent) -> done or error (backend answered).
 * Add ?demo=error to the address to see a refusal from the backend.
 */
export function SendCreditsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<FlowStatus>('idle');
  const [newBalance, setNewBalance] = useState<number | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();

  async function handleSubmit(input: { to: string; amount: number; note: string }) {
    setStatus('working');
    setErrorCode(undefined);
    try {
      const result = await sendCredits(input);
      // The backend reports the new balance. Never compute it in the interface.
      setNewBalance(result.newBalance);
      setStatus('done');
    } catch (error) {
      // Unknown codes show a generic message, so pass the code through as it is.
      setErrorCode(error instanceof ApiError ? error.code : 'UNKNOWN');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-[480px]">
      <Card>
        <TransferForm
          recipients={RECIPIENTS}
          available={MY_WALLET.available}
          status={status}
          errorCode={errorCode}
          newBalance={newBalance}
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
