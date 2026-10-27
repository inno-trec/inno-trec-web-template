import { Button, Checkbox, InlineAlert, PasswordField, TextField } from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useSession } from '../../auth/session';
import { PRIVACY_URL, TOOL_NAME } from '../../config';
import { acceptInvitation, getInvitation } from '../../data/api';
import { useSubmit } from '../../forms/useSubmit';
import { SignedOutFrame } from '../../layouts/SignedOutFrame';

type Invitation = Awaited<ReturnType<typeof getInvitation>>;
type Load = { state: 'loading' } | { state: 'expired' } | { state: 'error' } | { state: 'ready'; invitation: Invitation };

/**
 * Pattern: accepting an invitation. The link in the email carries a token (`/invitation?token=…`). The
 * person checks the name, chooses a password and is signed in. The email comes from the invitation and
 * cannot be changed here.
 */
export function InvitationPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    getInvitation(token).then(
      (invitation) => current && setLoad({ state: 'ready', invitation }),
      (error) => current && setLoad({ state: error?.code === 'link_expired' ? 'expired' : 'error' }),
    );
    return () => {
      current = false;
    };
  }, [token, attempt]);

  if (load.state === 'loading') {
    return (
      <SignedOutFrame heading={`Join ${TOOL_NAME}`}>
        <p role="status" className="m-0 text-ink-muted">
          Checking your invitation…
        </p>
      </SignedOutFrame>
    );
  }
  if (load.state === 'expired') {
    return (
      <SignedOutFrame heading="This invitation link does not work">
        <InlineAlert tone="warning" title="The link has expired or was already used">
          Ask the person who invited you to send a new invitation.
        </InlineAlert>
        <Link to="/sign-in">Go to sign in</Link>
      </SignedOutFrame>
    );
  }
  if (load.state === 'error') {
    return (
      <SignedOutFrame heading={`Join ${TOOL_NAME}`}>
        <InlineAlert tone="error" title="The invitation could not be checked">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </SignedOutFrame>
    );
  }
  return <AcceptForm token={token} invitation={load.invitation} />;
}

function AcceptForm({ token, invitation }: { token: string; invitation: Invitation }) {
  const { signedIn } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState(invitation.name);
  const [password, setPassword] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const submit = useSubmit();
  const expired = submit.code === 'link_expired';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const missing: Record<string, string> = {};
    if (!name.trim()) missing.name = 'Enter your name.';
    if (!password) missing.password = 'Choose a password.';
    if (!acceptPolicy) missing.acceptPolicy = 'Accept the privacy policy to continue.';
    if (Object.keys(missing).length) return submit.setFields(missing);
    submit.run(() => acceptInvitation(token, { name, password, acceptPolicy }), (s) => {
      signedIn(s);
      navigate('/', { replace: true });
    });
  }

  return (
    <SignedOutFrame heading={`Join ${TOOL_NAME}`} intro={`${invitation.invitedBy} invited you as ${invitation.roleLabel}. Choose a password to finish.`}>
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && (
          <InlineAlert tone="error" title={expired ? 'The invitation has expired' : 'Not saved'}>
            {expired ? 'Ask the person who invited you to send a new invitation.' : 'Check your connection and try again.'}
          </InlineAlert>
        )}
        <TextField label="Email" type="email" autoComplete="username" value={invitation.email} readOnly hint="From the invitation." />
        <TextField label="Name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={submit.fields.name} />
        <PasswordField label="Password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 12 characters." error={submit.fields.password} />
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
          {submit.working ? 'Creating your account…' : 'Create account'}
        </Button>
      </form>
    </SignedOutFrame>
  );
}
