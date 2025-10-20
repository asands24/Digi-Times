import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createGroupViaSupabase } from '../lib/createGroupFallback';
import toast from 'react-hot-toast';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onCreateGroup?: (input: CreateGroupPayload) => Promise<void> | void;
}

interface CreateGroupPayload {
  name: string;
  description: string;
}

type HostShell = {
  createGroup?: (input: CreateGroupPayload) => Promise<unknown> | unknown;
};

declare global {
  interface Window {
    digiTimesShell?: HostShell;
    digitimesShell?: HostShell;
    DigiTimesShell?: HostShell;
    appShell?: HostShell;
    applicationShell?: HostShell;
    createGroup?: HostShell['createGroup'];
  }
}

const SHELL_KEYS = [
  'digiTimesShell',
  'digitimesShell',
  'DigiTimesShell',
  'appShell',
  'applicationShell',
] as const;

function findShellHandler(target: Record<string, unknown>) {
  for (const key of SHELL_KEYS) {
    const candidate = target[key] as
      | { createGroup?: (input: CreateGroupPayload) => Promise<unknown> | unknown }
      | undefined;

    if (candidate && typeof candidate.createGroup === 'function') {
      return candidate.createGroup.bind(candidate) as (
        input: CreateGroupPayload
      ) => Promise<unknown> | unknown;
    }
  }

  const directCreate = target.createGroup as
    | ((input: CreateGroupPayload) => Promise<unknown> | unknown)
    | undefined;

  if (typeof directCreate === 'function') {
    return directCreate;
  }

  return undefined;
}

async function createGroupThroughHostOrFallback(payload: CreateGroupPayload) {
  if (typeof window === 'undefined') {
    throw new Error('Create group API is not available in this environment.');
  }

  const handler = findShellHandler(window as unknown as Record<string, unknown>);

  if (handler) {
    return handler(payload);
  }

  console.warn('[DigiTimes] No host createGroup bridge detected. Using Supabase fallback.');
  return createGroupViaSupabase(payload);
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onCreateGroup,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (onCreateGroup || typeof window === 'undefined') {
      return;
    }

    const handler = findShellHandler(window as unknown as Record<string, unknown>);

    if (!handler && process.env.NODE_ENV !== 'production') {
      console.warn(
        'CreateGroupDialog could not find a host shell handler. ' +
          'Expose window.digiTimesShell.createGroup to enable bridge-based group creation.'
      );
    }
  }, [onCreateGroup]);

  const handleClose = () => {
    onOpenChange(false);
    setGroupName('');
    setGroupDescription('');
    setSubmitting(false);
    setErrorMessage(null);
  };

  const forwardToShell = async (payload: CreateGroupPayload) => {
    const group = onCreateGroup
      ? await onCreateGroup(payload)
      : await createGroupThroughHostOrFallback(payload);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('digitimes:create-group', { detail: { group } }));

      try {
        window.parent?.postMessage?.(
          { type: 'digitimes:create-group', payload: { group } },
          '*'
        );
      } catch {
        // Ignore postMessage failures caused by sandboxed hosts.
      }
    }

    return group;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = groupName.trim();
    const description = groupDescription.trim();

    if (!name) {
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await forwardToShell({ name, description });
      toast.success('Group created successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to create group via host shell', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We were not able to start that group just yet.'
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="utility-dialog">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Give your new storytelling space a name and let your family know what
            to expect.
          </DialogDescription>
        </DialogHeader>

        <form className="form-stack" onSubmit={handleSubmit}>
          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="form-field">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g., The Bennett Family Digest"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
            />
            <p className="form-help">
              Choose a timeless title that feels right for your family or event.
            </p>
          </div>

          <div className="form-field">
            <Label htmlFor="group-description">Group Description</Label>
            <textarea
              id="group-description"
              className="dt-input dt-input--textarea"
              placeholder="Share the stories, milestones, and memories you'll be collecting."
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              rows={4}
            />
            <p className="form-help">
              A short description helps contributors know the tone you have in mind.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!groupName.trim() || submitting}>
              {submitting ? 'Creating…' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
