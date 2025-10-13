import * as React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'secondary' | 'outline';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'dt-badge--primary',
  secondary: 'dt-badge--secondary',
  outline: 'dt-badge--outline',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn('dt-badge', variantClasses[variant], className)}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';
