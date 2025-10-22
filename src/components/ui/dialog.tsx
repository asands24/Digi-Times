import * as React from 'react';
import { cn } from '../../utils/cn';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    previousFocusRef.current?.focus?.();
    previousFocusRef.current = null;
    return undefined;
  }, [open]);

  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function useDialogContext(component: string) {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error(`${component} must be used within a <Dialog>`);
  }
  return context;
}

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useDialogContext('DialogContent');
  const localRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open || !localRef.current) {
      return;
    }

    const container = localRef.current;
    const focusableSelectors =
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const focusables = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const first = focusables[0] ?? null;
    const last = focusables.length > 0 ? focusables[focusables.length - 1] : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (focusables.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === container
          ) {
            event.preventDefault();
            (last ?? first)?.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          (first ?? last)?.focus();
        }
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    (first ?? container).focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  const handleOverlayClick = () => {
    setOpen(false);
  };

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const assignRef = (node: HTMLDivElement | null) => {
    localRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <div className="dt-dialog__overlay" onClick={handleOverlayClick}>
      <div
        ref={assignRef}
        role="dialog"
        aria-modal="true"
        className={cn('dt-dialog__content', className)}
        onClick={handleContentClick}
        tabIndex={-1}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});

DialogContent.displayName = 'DialogContent';

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn('dt-dialog__header', className)}>
      {children}
    </div>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('dt-dialog__footer', className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(({ className, children, ...props }, ref) => (
  <h2 ref={ref} className={cn('dt-dialog__title', className)} {...props}>
    {children}
  </h2>
));

DialogTitle.displayName = 'DialogTitle';

interface DialogDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  DialogDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('dt-dialog__description', className)} {...props}>
    {children}
  </p>
));

DialogDescription.displayName = 'DialogDescription';
