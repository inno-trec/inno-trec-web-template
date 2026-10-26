import { Button, Checkbox, InlineAlert, PasswordField, TextField } from '@inno-trec/ui-web';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { safeNext, useSession } from '../../auth/session';
import { SAMPLE_PASSWORD, signIn } from '../../data/api';
import { useSubmit } from '../../forms/useSubmit';
import { SignedOutFrame } from '../../layouts/SignedOutFrame';

/** What to say for each error code from the backend. Never say whether the email or the password was wrong. */
const ERRORS: Record<string, { title: string; text: string }> = {
  invalid_credentials: { title: 'The email or password is wrong', text: 'Check both and try again. If you forgot your password, set a new one.' },
  account_requested: { title: 'Your account is waiting for approval', text: 'A community manager reviews new accounts. You get an email when you can sign in.' },
  account_deactivated: { title: 'Your account is deactivated', text: 'Ask a community manager to activate it again.' },
};
const FAILED = { title: 'Signing in did not work', text: 'Check your connection and try again.' };

/** Why the person is here, from `?reason=` in the address. */
const REASONS: Record<string, string> = {
  'signed-out': 'You are signed out.',
  expired: 'Your session ended. Sign in again to continue.',
  'password-reset': 'Your new password is saved. Sign in with it.',
};

export function SignInPage() {
  const { session, signedIn } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const submit = useSubmit();
  const next = safeNext(params.get('next'));
  const reason = REASONS[params.get('reason') ?? ''];

  if (session) return <Navigate to={next} replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing: Record<string, string> = {};
    if (!email.trim()) missing.email = 'Enter your email address.';
    if (!password) missing.password = 'Enter your password.';
    if (Object.keys(missing).length) return submit.setFields(missing);
    submit.run(() => signIn(email, password), (s) => {
      signedIn(s, remember);
      navigate(next, { replace: true });
    });
  }

  const error = submit.code ? (ERRORS[submit.code] ?? FAILED) : undefined;

  return (
    <SignedOutFrame
      heading="Sign in"
      intro="Use the account of your energy community."
      aside={
        <div className="flex flex-col gap-space-4">
          <p className="m-0">
            New here? <Link to="/sign-up">Ask for an account</Link>
          </p>
          {/* SAMPLE ONLY: delete this note in your tool. */}
          <div className="text-left">
            <InlineAlert tone="info" title="Sample accounts">
              Sign in as ana.ribeiro@example.org with the password {SAMPLE_PASSWORD}.
            </InlineAlert>
          </div>
        </div>
      }
    >
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {reason && !error && <InlineAlert tone="success" title={reason} />}
        {error && <InlineAlert tone="error" title={error.title}>{error.text}</InlineAlert>}
        <TextField label="Email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={submit.fields.email} />
        <PasswordField label="Password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={submit.fields.password} />
        <Checkbox label="Keep me signed in on this device" checked={remember} onChange={(e) => setRemember(e.target.checked)} hint="Leave it off on a shared computer." />
        <Button variant="primary" type="submit" disabled={submit.working}>
          {submit.working ? 'Signing in…' : 'Sign in'}
        </Button>
        <Link to="/forgot-password">Forgot your password?</Link>
      </form>
    </SignedOutFrame>
  );
}
