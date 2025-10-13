import { useState } from 'react';
import { Eye } from 'lucide-react';
import type { Template } from '../types/template';
import { TemplateDetailsDialog } from './TemplateDetailsDialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card className="template-card">
        <CardHeader className="template-card__header">
          {template.icon ? (
            <span className="template-card__icon" aria-hidden>
              {template.icon}
            </span>
          ) : null}
          <div>
            <h3 className="template-card__title">{template.title}</h3>
            <Badge variant="secondary" className="template-card__badge">
              {template.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="template-card__body">
          <p>{template.description}</p>
          <div className="template-card__example">
            <span className="template-card__example-label">Example:</span>
            <span>{template.example}</span>
          </div>
        </CardContent>

        <CardFooter className="template-card__footer">
          <Button
            variant="outline"
            className="template-card__action"
            onClick={() => setShowDetails(true)}
          >
            <Eye size={16} strokeWidth={1.75} />
            <span>See Details</span>
          </Button>
          <Button className="template-card__action template-card__action--primary">
            Use This Template
          </Button>
        </CardFooter>
      </Card>

      <TemplateDetailsDialog
        template={template}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
}
