import * as React from 'react';
import { cn } from '../utils/cn';

type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses = 'dt-button';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'dt-button--primary',
  outline: 'dt-button--outline',
  ghost: 'dt-button--ghost',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: '',
  sm: 'dt-button--sm',
  lg: 'dt-button--lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
