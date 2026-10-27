import { Button, Checkbox, InlineAlert, PasswordField, TextField, Textarea } from '@inno-trec/ui-web';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { PRIVACY_URL } from '../../config';
import { requestAccount } from '../../data/api';
import { useSubmit } from '../../forms/useSubmit';
import { SignedOutFrame } from '../../layouts/SignedOutFrame';

/**
 * Pattern: asking for an account. The person chooses a password now; a community manager approves the
 * request on the Users page, and only then can the person sign in. The backend checks the email and the
 * password rules and returns a message per field.
 */
export function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = useSubmit();

  if (sent) {
    return (
      <SignedOutFrame heading="Request sent">
        <InlineAlert tone="success" title="A community manager will review your request">
          We sent the answer to {email.trim()}. Then you can sign in with the password you chose.
        </InlineAlert>
        <Link to="/sign-in">Back to sign in</Link>
      </SignedOutFrame>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing: Record<string, string> = {};
    if (!name.trim()) missing.name = 'Enter your name.';
    if (!email.trim()) missing.email = 'Enter your email address.';
    if (!password) missing.password = 'Choose a password.';
    if (!acceptPolicy) missing.acceptPolicy = 'Accept the privacy policy to continue.';
    if (Object.keys(missing).length) return submit.setFields(missing);
    submit.run(() => requestAccount({ name, email, password, message, acceptPolicy }), () => setSent(true));
  }

  return (
    <SignedOutFrame
      heading="Ask for an account"
      intro="A community manager approves new accounts. You get an email when you can sign in."
      aside={
        <p className="m-0">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      }
    >
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && <InlineAlert tone="error" title="Not sent">Check your connection and try again.</InlineAlert>}
        <TextField label="Name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={submit.fields.name} />
        <TextField label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={submit.fields.email} />
        <PasswordField label="Password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 12 characters." error={submit.fields.password} />
        <Textarea
          label="Message to the manager"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={300}
          hint="Optional. Help the manager recognize you, for example with your address."
        />
        <Checkbox
          label={
            <>
              I accept the{' '}
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
                privacy policy
              </a>
            </>
          }
          checked={acceptPolicy}
          onChange={(e) => setAcceptPolicy(e.target.checked)}
          error={submit.fields.acceptPolicy}
        />
        <Button variant="primary" type="submit" disabled={submit.working}>
          {submit.working ? 'Sending…' : 'Ask for an account'}
        </Button>
      </form>
    </SignedOutFrame>
  );
}
