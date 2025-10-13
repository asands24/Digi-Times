import { useState } from 'react';
import { Plus, Sparkles, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { CreateGroupDialog } from './CreateGroupDialog';
import { JoinGroupDialog } from './JoinGroupDialog';

interface HeroActionsProps {
  showGallery: boolean;
  onToggleGallery: () => void;
}

export function HeroActions({ showGallery, onToggleGallery }: HeroActionsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  return (
    <>
      <section className="hero-actions">
        <div className="hero-actions__intro">
          <Sparkles size={20} strokeWidth={1.75} />
          <div>
            <p className="hero-actions__kicker">Curated Editorial Templates</p>
            <h2 className="hero-actions__headline">
              Chronicle your family&apos;s stories with timeless layouts
            </h2>
          </div>
        </div>

        <div className="hero-actions__primary">
          <Button
            size="lg"
            className="hero-actions__button hero-actions__button--create"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={18} strokeWidth={1.75} />
            <span>Create Group</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="hero-actions__button hero-actions__button--join"
            onClick={() => setShowJoinDialog(true)}
          >
            <UserPlus size={18} strokeWidth={1.75} />
            <span>Join Group</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="hero-actions__toggle"
          onClick={onToggleGallery}
        >
          <Sparkles size={18} strokeWidth={1.75} />
          <span>
            {showGallery ? 'Hide' : 'Browse'} Template Gallery for New Ideas
          </span>
        </Button>
      </section>

      <CreateGroupDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <JoinGroupDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
    </>
  );
}
