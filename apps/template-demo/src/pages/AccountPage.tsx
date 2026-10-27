import { Button, Card, InlineAlert, PasswordField, Switch, TextField } from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '../auth/session';
import { changePassword, getAccount, updateAccount, type User } from '../data/api';
import { useSubmit } from '../forms/useSubmit';

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; user: User };

/**
 * Pattern: the signed-in person's own account. Two forms, one task each: the profile (with the screen's
 * primary button) and the password. The email and the role are shown but changed by an administrator.
 */
export function AccountPage() {
  const { session } = useSession();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    getAccount(session!.userId).then(
      (user) => current && setLoad({ state: 'ready', user }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [session?.userId, attempt]);

  if (load.state === 'loading') {
    return (
      <Card>
        <p role="status" className="m-0 text-ink-muted">
          Loading your account…
        </p>
      </Card>
    );
  }
  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="Your account could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="grid max-w-[960px] items-start gap-space-4 lg:grid-cols-2">
      <ProfileForm user={load.user} roleLabel={session!.roleLabel} />
      <PasswordForm userId={load.user.id} />
    </div>
  );
}

function ProfileForm({ user, roleLabel }: { user: User; roleLabel: string }) {
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [emailAlerts, setEmailAlerts] = useState(user.emailAlerts);
  const [saved, setSaved] = useState(false);
  const submit = useSubmit();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (!name.trim()) return submit.setFields({ name: 'Enter your name.' });
    submit.run(() => updateAccount(user.id, { name, emailAlerts }), (u) => {
      update({ name: u.name });
      setSaved(true);
    });
  }

  return (
    <Card title="Profile">
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {saved && <InlineAlert tone="success" title="Your profile is saved" />}
        {submit.failed && <InlineAlert tone="error" title="Not saved">Check your connection and try again. Nothing was changed.</InlineAlert>}
        <TextField label="Name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={submit.fields.name} />
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-4 gap-y-space-2">
          <dt className="text-ink-muted">Email</dt>
          <dd className="m-0 break-words">{user.email}</dd>
          <dt className="text-ink-muted">Role</dt>
          <dd className="m-0">{roleLabel}</dd>
        </dl>
        <p className="m-0 text-ink-muted">To change your email or role, ask an administrator.</p>
        <Switch label="Email alerts" checked={emailAlerts} onChange={setEmailAlerts} hint="Sends an email when an asset needs attention." />
        <div>
          <Button variant="primary" type="submit" disabled={submit.working}>
            {submit.working ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordForm({ userId }: { userId: string }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [saved, setSaved] = useState(false);
  const submit = useSubmit();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const missing: Record<string, string> = {};
    if (!current) missing.currentPassword = 'Enter your current password.';
    if (!next) missing.newPassword = 'Choose a new password.';
    if (Object.keys(missing).length) return submit.setFields(missing);
    submit.run(() => changePassword(userId, current, next), () => {
      setCurrent('');
      setNext('');
      setSaved(true);
    });
  }

  return (
    <Card title="Password">
      <form className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {saved && <InlineAlert tone="success" title="Your password is changed">Use it the next time you sign in.</InlineAlert>}
        {submit.failed && <InlineAlert tone="error" title="Not changed">Check your connection and try again.</InlineAlert>}
        <PasswordField label="Current password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={submit.fields.currentPassword} />
        <PasswordField label="New password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="At least 12 characters." error={submit.fields.newPassword} />
        <div>
          <Button type="submit" disabled={submit.working}>
            {submit.working ? 'Changing…' : 'Change password'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
