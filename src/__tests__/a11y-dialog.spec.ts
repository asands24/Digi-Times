import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const DialogHarness = () => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Launch
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portal</DialogTitle>
          </DialogHeader>
          <button type="button">First action</button>
          <button type="button">Second action</button>
          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

describe('Dialog accessibility', () => {
  it('traps focus within the dialog while open', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: /launch/i });
    await user.click(trigger);

    const firstAction = screen.getByRole('button', { name: /first action/i });
    const secondAction = screen.getByRole('button', { name: /second action/i });
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(firstAction).toHaveFocus();

    await user.tab();
    expect(secondAction).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(firstAction).toHaveFocus();

    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: /launch/i });
    await user.click(trigger);

    const firstAction = screen.getByRole('button', { name: /first action/i });
    fireEvent.keyDown(firstAction, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
