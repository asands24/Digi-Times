import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../utils/cn';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <div className="dt-dropdown">{children}</div>
    </DropdownMenuPrimitive.Root>
  );
}

type TriggerElement = React.ElementRef<typeof DropdownMenuPrimitive.Trigger>;
type TriggerProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Trigger
>;

export const DropdownMenuTrigger = React.forwardRef<TriggerElement, TriggerProps>(
  ({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        !props.asChild && 'dt-dropdown__trigger',
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Trigger>
  ),
);

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  align?: 'start' | 'end';
}

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(
  (
    {
      className,
      sideOffset = 8,
      align = 'start',
      children,
      ...props
    },
    ref,
  ) => {
    const alignmentClass =
      align === 'end'
        ? 'dt-dropdown__content--end'
        : 'dt-dropdown__content--start';

    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          align={align}
          className={cn('dt-dropdown__content', alignmentClass, className)}
          {...props}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    );
  },
);

DropdownMenuContent.displayName = 'DropdownMenuContent';

type ItemElement = React.ElementRef<typeof DropdownMenuPrimitive.Item>;
type ItemProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
>;

export const DropdownMenuItem = React.forwardRef<ItemElement, ItemProps>(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn('dt-dropdown__item', className)}
      {...props}
    />
  ),
);

DropdownMenuItem.displayName = 'DropdownMenuItem';

type SeparatorElement = React.ElementRef<typeof DropdownMenuPrimitive.Separator>;
type SeparatorProps = React.ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
>;

export const DropdownMenuSeparator = React.forwardRef<
  SeparatorElement,
  SeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('dt-dropdown__separator', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
