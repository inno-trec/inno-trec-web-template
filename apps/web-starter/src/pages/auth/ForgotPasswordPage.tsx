import { Button, InlineAlert, TextField } from '@inno-trec/ui-web';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { requestPasswordReset } from '../../data/api';
import { useSubmit } from '../../forms/useSubmit';
import { SignedOutFrame } from '../../layouts/SignedOutFrame';

/**
 * Pattern: asking for a password reset. The answer is the same whether an account uses the email or not,
 * so nobody can find out who has an account.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = useSubmit();

  if (sent) {
    return (
      <SignedOutFrame heading="Check your email">
        <InlineAlert tone="success" title="If an account uses this email, we sent it a link">
          Open the link in the email sent to {email.trim()} to choose a new password. The link works for one hour.
        </InlineAlert>
        <Link to="/sign-in">Back to sign in</Link>
        {/* SAMPLE ONLY: there is no email in the starter. Delete this link in your tool. */}
        <p className="m-0 text-ink-muted">
          Sample: <Link to="/reset-password?token=sample">open the link from the email</Link>
        </p>
      </SignedOutFrame>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return submit.setFields({ email: 'Enter your email address.' });
    submit.run(() => requestPasswordReset(email), () => setSent(true));
  }

  return (
    <SignedOutFrame
      heading="Reset your password"
      intro="Enter the email of your account. We send you a link to choose a new password."
      aside={
        <p className="m-0">
          Remember it? <Link to="/sign-in">Sign in</Link>
        </p>
      }
    >
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && <InlineAlert tone="error" title="Not sent">Check your connection and try again.</InlineAlert>}
        <TextField label="Email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={submit.fields.email} />
        <Button variant="primary" type="submit" disabled={submit.working}>
          {submit.working ? 'Sending…' : 'Send the link'}
        </Button>
      </form>
    </SignedOutFrame>
  );
}
