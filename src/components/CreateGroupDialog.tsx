import { useState, type Dispatch, type FormEvent, type SetStateAction } from 'react';
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
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const handleClose = () => {
    onOpenChange(false);
    setGroupName('');
    setGroupDescription('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = groupName.trim();
    const description = groupDescription.trim();

    if (!name) {
      return;
    }

    // TODO: Wire this submission into the production create group workflow.
    console.log('Create group request', { name, description });
    handleClose();
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!groupName.trim()}>
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
