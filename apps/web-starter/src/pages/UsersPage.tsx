import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  DateField,
  Dialog,
  InlineAlert,
  RadioGroup,
  Switch,
  TextField,
  Textarea,
  type Column,
} from '@inno-trec/ui-web';
import { useEffect, useState, type FormEvent } from 'react';
import { formatDate, formatRelative } from '../charts/format';
import { ApiError, inviteUser, listUsers, updateUser, type Role, type RoleId, type User } from '../data/api';

type UserStatus = User['status'];

const STATUS: Record<UserStatus, { tone: 'success' | 'info' | 'neutral'; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  invited: { tone: 'info', label: 'Invited' },
  deactivated: { tone: 'neutral', label: 'Deactivated' },
};

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; users: User[]; roles: Role[] };
type Open = 'invite' | 'edit' | 'deactivate' | null;

/**
 * Pattern: a list with detail, and forms in dialogs.
 *
 * Users and roles belong to the community, not to one tool: the shared data API (WP2) keeps one list
 * for every INNO-TREC tool, and people sign in once through the project's identity provider (decision 12).
 * Only one place in the platform should manage them; this page shows how that screen works. The page has one primary button (Invite user).
 * Each dialog is one short task; a form shows the backend's errors next to the fields.
 * Add ?demo=empty or ?demo=error to the address to see the other states.
 */
export function UsersPage() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState<Open>(null);
  const [notice, setNotice] = useState<string>();
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    let current = true;
    setLoad({ state: 'loading' });
    listUsers().then(
      ({ users, roles }) => current && setLoad({ state: 'ready', users, roles }),
      () => current && setLoad({ state: 'error' }),
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  if (load.state === 'loading') {
    return (
      <Card>
        <p role="status" className="m-0 text-ink-muted">
          Loading users…
        </p>
      </Card>
    );
  }

  if (load.state === 'error') {
    return (
      <div className="flex max-w-[640px] flex-col gap-space-4">
        <InlineAlert tone="error" title="The users could not be loaded">
          Check your connection and try again.
        </InlineAlert>
        <div>
          <Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
        </div>
      </div>
    );
  }

  const { users, roles } = load;
  const roleLabel = (id: RoleId) => roles.find((r) => r.id === id)?.label ?? id;
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.label, description: r.description }));
  const selected = users.find((u) => u.id === selectedId) ?? users[0];

  // Put the backend's answer into the list, select that user and say what happened.
  function saved(user: User, message: string) {
    if (load.state !== 'ready') return;
    const exists = load.users.some((u) => u.id === user.id);
    setLoad({ ...load, users: exists ? load.users.map((u) => (u.id === user.id ? user : u)) : [...load.users, user] });
    setSelectedId(user.id);
    setOpen(null);
    setNotice(message);
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u) => roleLabel(u.role) },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={STATUS[u.status].tone} dot>{STATUS[u.status].label}</Badge> },
  ];

  const invite = (
    <Button variant="primary" size="sm" onClick={() => { setNotice(undefined); setOpen('invite'); }}>
      Invite user
    </Button>
  );

  return (
    <div className="flex flex-col gap-space-4">
      {problem && (
        <InlineAlert tone="error" title={problem}>
          Check your connection and try again. Nothing was changed.
        </InlineAlert>
      )}
      {notice && (
        <InlineAlert tone="success" title={notice}>
          The change is saved.
        </InlineAlert>
      )}

      {users.length === 0 ? (
        <Card title="Users" actions={invite}>
          <p className="m-0 text-ink-muted">No users yet. Invite the first person who will use this tool.</p>
        </Card>
      ) : (
        <div className="grid items-start gap-space-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card title="Users" subtitle="Choose a user to see the details" actions={invite} flush>
            <DataTable columns={columns} rows={users} rowKey="id" selectedKey={selected.id} onRowClick={(u) => setSelectedId(u.id)} />
          </Card>
          <UserDetail
            user={selected}
            roleLabel={roleLabel(selected.role)}
            onEdit={() => { setNotice(undefined); setOpen('edit'); }}
            onDeactivate={() => { setNotice(undefined); setOpen('deactivate'); }}
            onActivate={() => {
              setNotice(undefined);
              setProblem(undefined);
              updateUser(selected.id, { status: 'active' }).then(
                (u) => saved(u, `${u.name} is active again`),
                () => setProblem(`${selected.name} could not be activated`),
              );
            }}
          />
        </div>
      )}

      <InviteDialog open={open === 'invite'} roles={roleOptions} onClose={() => setOpen(null)} onSaved={(u) => saved(u, `Invitation sent to ${u.email}`)} />
      {selected && (
        <>
          <EditDialog open={open === 'edit'} user={selected} roles={roleOptions} onClose={() => setOpen(null)} onSaved={(u) => saved(u, `${u.name} is updated`)} />
          <DeactivateDialog open={open === 'deactivate'} user={selected} onClose={() => setOpen(null)} onSaved={(u) => saved(u, `${u.name} is deactivated`)} />
        </>
      )}
    </div>
  );
}

function UserDetail({ user, roleLabel, onEdit, onDeactivate, onActivate }: { user: User; roleLabel: string; onEdit: () => void; onDeactivate: () => void; onActivate: () => void }) {
  const facts: Array<[string, string]> = [
    ['Email', user.email],
    ['Role', roleLabel],
    ['Last active', formatRelative(user.lastActiveAt)],
    ['Access until', user.accessUntil ? formatDate(user.accessUntil) : 'No end date'],
    ['Email alerts', user.emailAlerts ? 'On' : 'Off'],
  ];
  return (
    <Card title={user.name} actions={<Badge tone={STATUS[user.status].tone} dot>{STATUS[user.status].label}</Badge>}>
      <div className="flex flex-col gap-space-4">
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-space-4 gap-y-space-2">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="text-ink-muted">{term}</dt>
              <dd className="m-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        {user.note && <p className="m-0 text-ink-muted">Note: {user.note}</p>}
        <div className="flex flex-wrap gap-space-2">
          <Button size="sm" onClick={onEdit}>
            Edit
          </Button>
          {user.status === 'deactivated' ? (
            <Button size="sm" onClick={onActivate}>
              Activate
            </Button>
          ) : (
            <Button size="sm" variant="danger" onClick={onDeactivate}>
              Deactivate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Sends a request and keeps the backend's answer: field messages, or one message for the whole form. */
function useSubmit() {
  const [working, setWorking] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  async function run<T>(request: () => Promise<T>, done: (result: T) => void) {
    setWorking(true);
    setFailed(false);
    setFields({});
    try {
      done(await request());
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) setFields(error.fields);
      else setFailed(true);
    } finally {
      setWorking(false);
    }
  }
  return { working, fields, failed, setFields, run };
}

type RoleOption = { value: RoleId; label: string; description: string };

const FAILED = 'The change could not be saved. Check your connection and try again. Nothing was changed.';

function InviteDialog({ open, roles, onClose, onSaved }: { open: boolean; roles: RoleOption[]; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleId>('viewer');
  const [sendEmail, setSendEmail] = useState(true);
  const submit = useSubmit();

  // Start empty each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setRole('viewer');
    setSendEmail(true);
    submit.setFields({});
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // The form checks only that the fields are filled in. The backend checks everything else.
    const missing: Record<string, string> = {};
    if (!name.trim()) missing.name = 'Enter the person’s name.';
    if (!email.trim()) missing.email = 'Enter an email address, for example name@example.org.';
    if (Object.keys(missing).length) return submit.setFields(missing);
    submit.run(() => inviteUser({ name, email, role, sendEmail }), onSaved);
  }

  return (
    <Dialog
      open={open}
      title="Invite a user"
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="invite-user" disabled={submit.working}>
            {submit.working ? 'Inviting…' : 'Invite user'}
          </Button>
        </>
      }
    >
      <form id="invite-user" className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && <InlineAlert tone="error" title="Not sent">{FAILED}</InlineAlert>}
        <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={submit.fields.name} autoComplete="off" />
        <TextField label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={submit.fields.email} autoComplete="off" />
        <RadioGroup label="Role" options={roles} value={role} onChange={(v) => setRole(v as RoleId)} />
        <Checkbox label="Send an invitation email" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} hint="The person receives a link to set a password." />
      </form>
    </Dialog>
  );
}

function EditDialog({ open, user, roles, onClose, onSaved }: { open: boolean; user: User; roles: RoleOption[]; onClose: () => void; onSaved: (u: User) => void }) {
  const [role, setRole] = useState<RoleId>(user.role);
  const [accessUntil, setAccessUntil] = useState(user.accessUntil ?? '');
  const [emailAlerts, setEmailAlerts] = useState(user.emailAlerts);
  const [note, setNote] = useState(user.note);
  const submit = useSubmit();

  // Start from the saved values each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setRole(user.role);
    setAccessUntil(user.accessUntil ?? '');
    setEmailAlerts(user.emailAlerts);
    setNote(user.note);
    submit.setFields({});
  }, [open, user]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.run(() => updateUser(user.id, { role, accessUntil: accessUntil || null, emailAlerts, note }), onSaved);
  }

  return (
    <Dialog
      open={open}
      title={`Edit ${user.name}`}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="edit-user" disabled={submit.working}>
            {submit.working ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="edit-user" className="flex flex-col gap-space-4" onSubmit={onSubmit} noValidate>
        {submit.failed && <InlineAlert tone="error" title="Not saved">{FAILED}</InlineAlert>}
        <RadioGroup label="Role" options={roles} value={role} onChange={(v) => setRole(v as RoleId)} />
        <DateField label="Access until" value={accessUntil} onChange={(e) => setAccessUntil(e.target.value)} hint="Leave empty for no end date." error={submit.fields.accessUntil} />
        <Switch label="Email alerts" checked={emailAlerts} onChange={setEmailAlerts} hint="Sends an email when an asset needs attention." />
        <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} hint="Visible to administrators only. Up to 300 characters." />
      </form>
    </Dialog>
  );
}

function DeactivateDialog({ open, user, onClose, onSaved }: { open: boolean; user: User; onClose: () => void; onSaved: (u: User) => void }) {
  const submit = useSubmit();
  return (
    <Dialog
      open={open}
      size="sm"
      title={`Deactivate ${user.name}?`}
      onClose={onClose}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={submit.working} onClick={() => submit.run(() => updateUser(user.id, { status: 'deactivated' }), onSaved)}>
            {submit.working ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </>
      }
    >
      {submit.failed && <InlineAlert tone="error" title="Not deactivated">{FAILED}</InlineAlert>}
      <p>{user.name} will no longer be able to sign in. You can activate the account again later.</p>
    </Dialog>
  );
}
