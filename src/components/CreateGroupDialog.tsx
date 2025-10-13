import {
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

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  onCreateGroup?: (input: CreateGroupPayload) => Promise<void> | void;
}

interface CreateGroupPayload {
  name: string;
  description: string;
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

  const handleClose = () => {
    onOpenChange(false);
    setGroupName('');
    setGroupDescription('');
    setSubmitting(false);
    setErrorMessage(null);
  };

  const forwardToShell = async (payload: CreateGroupPayload) => {
    if (onCreateGroup) {
      await onCreateGroup(payload);
      return;
    }

    if (typeof window === 'undefined') {
      throw new Error('Create group API is not available in this environment.');
    }

    const globalTarget = window as unknown as Record<string, unknown>;
    const candidateKeys = [
      'digiTimesShell',
      'digitimesShell',
      'DigiTimesShell',
      'appShell',
      'applicationShell',
    ];

    for (const key of candidateKeys) {
      const candidate = globalTarget[key] as
        | { createGroup?: (input: CreateGroupPayload) => Promise<unknown> | unknown }
        | undefined;
      if (candidate && typeof candidate.createGroup === 'function') {
        await candidate.createGroup(payload);
        return;
      }
    }

    const directCreate = globalTarget['createGroup'] as
      | ((input: CreateGroupPayload) => Promise<unknown> | unknown)
      | undefined;
    if (typeof directCreate === 'function') {
      await directCreate(payload);
      return;
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'digitimes:create-group',
          payload,
        },
        '*'
      );
      return;
    }

    throw new Error('Create group API has not been provided by the host shell yet.');
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
