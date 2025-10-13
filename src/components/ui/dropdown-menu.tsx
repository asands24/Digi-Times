import * as React from 'react';
import { cn } from '../../utils/cn';

type Align = 'start' | 'end';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
}

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error(`${component} must be used within a <DropdownMenu>`);
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target)) {
        return;
      }

      if (contentRef.current?.contains(target)) {
        return;
      }

      if (triggerRef.current || contentRef.current) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, triggerRef, contentRef }}
    >
      <div className="dt-dropdown">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLElement,
  DropdownMenuTriggerProps
>(({ children, asChild = false }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenuContext(
    'DropdownMenuTrigger'
  );

  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    type ChildProps = {
      onClick?: (event: React.MouseEvent) => void;
      ref?: React.Ref<HTMLElement>;
      'aria-haspopup'?: string;
      'aria-expanded'?: boolean;
    };

    const child = children as React.ReactElement<ChildProps>;

    const handleRef = (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    };

    const handleChildClick = (event: React.MouseEvent) => {
      child.props.onClick?.(event);
      handleClick();
    };

    return React.cloneElement(child, {
      ref: handleRef,
      onClick: handleChildClick,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
    } as ChildProps);
  }

  return (
    <button
      ref={(node) => {
        triggerRef.current = node ?? null;
        if (typeof ref === 'function') {
          ref(node as unknown as HTMLElement);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLElement | null>).current =
            (node as unknown as HTMLElement) ?? null;
        }
      }}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={handleClick}
      className="dt-button dt-button--ghost dt-dropdown__trigger"
    >
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
}

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = 'start', ...props }, ref) => {
  const { open, contentRef } = useDropdownMenuContext(
    'DropdownMenuContent'
  );

  if (!open) {
    return null;
  }

  const alignmentClass =
    align === 'end'
      ? 'dt-dropdown__content--end'
      : 'dt-dropdown__content--start';

  return (
    <div
      ref={(node) => {
        contentRef.current = node ?? null;
        if (typeof ref === 'function') {
          ref(node as HTMLDivElement);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current =
            node ?? null;
        }
      }}
      role="menu"
      className={cn(
        'dt-dropdown__content',
        alignmentClass,
        className
      )}
      {...props}
    />
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext('DropdownMenuItem');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      className={cn('dt-dropdown__item', className)}
      onClick={handleClick}
      {...props}
    />
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('dt-dropdown__separator', className)}
    role="separator"
    {...props}
  />
));

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
