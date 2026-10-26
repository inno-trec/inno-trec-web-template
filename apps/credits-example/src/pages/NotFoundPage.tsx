import { Button, InlineAlert } from '@inno-trec/ui-web';
import { useNavigate } from 'react-router';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    // data-not-found lets the smoke tests tell this page apart from a real one. Keep it.
    <div data-not-found className="flex max-w-[480px] flex-col gap-space-4">
      <InlineAlert tone="info" title="Page not found">
        This address does not exist in this tool. Go back to the overview.
      </InlineAlert>
      <div>
        <Button variant="primary" onClick={() => navigate('/')}>
          Back to overview
        </Button>
      </div>
    </div>
  );
}
