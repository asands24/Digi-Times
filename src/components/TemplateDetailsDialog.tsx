import { Calendar, Image, Mail, Users } from 'lucide-react';
import type { Template } from '../types/template';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface TemplateDetailsDialogProps {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateDetailsDialog({
  template,
  open,
  onOpenChange,
}: TemplateDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="template-details">
        <DialogHeader className="template-details__header">
          <span className="template-details__icon" aria-hidden>
            {template.icon}
          </span>
          <div>
            <DialogTitle className="template-details__title">
              {template.title}
            </DialogTitle>
            <Badge variant="secondary" className="template-details__badge">
              {template.category}
            </Badge>
          </div>
        </DialogHeader>

        <DialogDescription className="template-details__description">
          {template.description}
        </DialogDescription>

        <div className="template-details__body">
          <div className="template-details__example">
            <h4>Example Use Case</h4>
            <p>{template.example}</p>
          </div>

          <div className="template-details__features">
            <h4>What&apos;s Included</h4>
            <ul>
              <li>
                <Calendar size={16} strokeWidth={1.75} />
                <span>Customizable posting schedule</span>
              </li>
              <li>
                <Users size={16} strokeWidth={1.75} />
                <span>Unlimited group members</span>
              </li>
              <li>
                <Image size={16} strokeWidth={1.75} />
                <span>Photo uploads & galleries</span>
              </li>
              <li>
                <Mail size={16} strokeWidth={1.75} />
                <span>Email notifications</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="template-details__footer">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="template-details__cta">Use This Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
