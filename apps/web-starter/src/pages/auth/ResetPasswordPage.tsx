import { Button, InlineAlert, PasswordField } from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { checkResetLink, resetPassword } from '../../data/api';
import { useSubmit } from '../../forms/useSubmit';
import { SignedOutFrame } from '../../layouts/SignedOutFrame';

type Load = 'loading' | 'ready' | 'expired' | 'error';

/** Pattern: choosing a new password from the link in the reset email (`/reset-password?token=…`). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>('loading');
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState('');
  const submit = useSubmit();

  useEffect(() => {
    let current = true;
    setLoad('loading');
    checkResetLink(token).then(
      () => current && setLoad('ready'),
      (error) => current && setLoad(error?.code === 'link_expired' ? 'expired' : 'error'),
    );
    return () => {
      current = false;
    };
  }, [token, attempt]);

  if (load === 'loading') {
    return (
      <SignedOutFrame heading="Choose a new password">
        <p role="status" className="m-0 text-ink-muted">
          Checking your link…
        </p>
      </SignedOutFrame>
    );
  }
  if (load === 'expired' || submit.code === 'link_expired') {
    return (
      <SignedOutFrame heading="This link does not work">
        <InlineAlert tone="warning" title="The link has expired or was already used">
          Ask for a new link. It works for one hour.
        </InlineAlert>
        <Link to="/forgot-password">Ask for a new link</Link>
      </SignedOutFrame>
    );
  }
  if (load === 'error') {
    return (
      <SignedOutFrame heading="Choose a new password">
        <InlineAlert tone="error" title="The link could not be checked">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </SignedOutFrame>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) return submit.setFields({ password: 'Choose a password.' });
    submit.run(() => resetPassword(token, password), () => navigate('/sign-in?reason=password-reset', { replace: true }));
  }

  return (
    <SignedOutFrame heading="Choose a new password" intro="You will sign in with it on every device.">
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && <InlineAlert tone="error" title="Not saved">Check your connection and try again.</InlineAlert>}
        <PasswordField label="New password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 12 characters." error={submit.fields.password} />
        <Button variant="primary" type="submit" disabled={submit.working}>
          {submit.working ? 'Saving…' : 'Save password'}
        </Button>
      </form>
    </SignedOutFrame>
  );
}
