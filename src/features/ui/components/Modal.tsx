import React, { useEffect, useRef, Fragment, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

/**
 * Modal Component - Accessible dialog following Web Interface Guidelines
 * 
 * Features:
 * - Proper ARIA roles (dialog/alertdialog)
 * - Focus trapping
 * - Focus restoration on close
 * - Escape key to close
 * - Click backdrop to close
 * - Scroll lock on body
 * - Portal rendering
 * - Reduced motion support
 * - Overscroll containment
 */

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer actions */
  footer?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop click */
  closeOnBackdropClick?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Prevent body scroll */
  preventScroll?: boolean;
  /** Modal type */
  type?: 'dialog' | 'alertdialog';
  /** Custom ID */
  id?: string;
  /** Z-index */
  zIndex?: number;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '560px' },
  lg: { maxWidth: '720px' },
  xl: { maxWidth: '960px' },
  full: { maxWidth: 'calc(100vw - var(--space-8))', width: 'calc(100vw - var(--space-8))' },
};

const backdropStyles: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(2px)',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-4)',
  animation: 'fadeIn 0.2s var(--ease-out)',
  overscrollBehavior: 'contain',
};

const modalStyles: React.CSSProperties = {
  position: 'relative',
  backgroundColor: 'var(--surface-secondary)',
  borderRadius: 'var(--radius-modal)',
  boxShadow: 'var(--shadow-xl)',
  maxHeight: 'calc(100vh - var(--space-8))',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'slideUp 0.2s var(--ease-out)',
  width: '100%',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  borderBottom: '1px solid var(--surface-border)',
  flexShrink: 0,
};

const titleStyles: React.CSSProperties = {
  fontSize: 'var(--text-xl)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-primary)',
  margin: 0,
  lineHeight: 'var(--leading-tight)',
  flex: 1,
};

const descriptionStyles: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-secondary)',
  margin: 'var(--space-1) 0 0 0',
  lineHeight: 'var(--leading-normal)',
};

const closeButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'transparent',
  color: 'var(--text-tertiary)',
  border: 'none',
  cursor: 'pointer',
  transition: 'var(--transition-all)',
  flexShrink: 0,
};

const contentStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 'var(--space-6)',
  overscrollBehavior: 'contain',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 'var(--space-3)',
  padding: 'var(--space-4) var(--space-6)',
  borderTop: '1px solid var(--surface-border)',
  flexShrink: 0,
  flexWrap: 'wrap',
};

const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes slideDown {
    from { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
    to { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
  }
`;

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScroll = true,
  type = 'dialog',
  id,
  zIndex = 1000,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const styleRef = useRef<HTMLStyleElement>(null);

  // Inject keyframes once
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal after render
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
      }
    } else {
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
      
      // Restore body scroll
      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [isOpen, preventScroll]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !closeOnEscape) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role={type}
      aria-modal="true"
      aria-labelledby={`${id || 'modal'}-title`}
      aria-describedby={description ? `${id || 'modal'}-description` : undefined}
      ref={modalRef}
      tabIndex={-1}
      style={{
        ...modalStyles,
        ...sizeStyles[size],
        zIndex,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{keyframes}</style>
      <header style={headerStyles}>
        <div>
          <h2 id={`${id || 'modal'}-title`} style={titleStyles}>
            {title}
          </h2>
          {description && (
            <p id={`${id || 'modal'}-description`} style={descriptionStyles}>
              {description}
            </p>
          )}
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyles}
            aria-label="Cerrar modal"
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, { backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)' });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, closeButtonStyles);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </header>
      <div style={contentStyles}>
        {children}
      </div>
      {footer && (
        <footer style={footerStyles}>
          {footer}
        </footer>
      )}
    </div>
  );

  const backdrop = (
    <div
      style={{ ...backdropStyles, zIndex: zIndex - 1 }}
      onClick={closeOnBackdropClick ? onClose : undefined}
      aria-hidden="true"
    />
  );

  return createPortal(
    <Fragment>
      {backdrop}
      {modalContent}
    </Fragment>,
    document.body
  );
};

/**
 * Confirmation Modal - Pre-built confirmation dialog
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  loading = false,
}: ConfirmModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    type="alertdialog"
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant === 'warning' ? 'secondary' : variant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </>
    }
  >
    <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
      {message}
    </p>
  </Modal>
);

/**
 * Alert Modal - Simple alert dialog
 */
export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Entendido',
  variant = 'info',
}: AlertModalProps) => {
  const variantColors: Record<string, string> = {
    info: 'var(--color-info)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type="alertdialog"
      size="sm"
      footer={
        <Button variant="primary" onClick={onClose} style={{ minWidth: '120px' }}>
          {confirmText}
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <div style={{
          flexShrink: 0,
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: `${variantColors[variant]}15`,
          color: variantColors[variant],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {variant === 'success' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          {variant === 'error' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {variant === 'warning' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {variant === 'info' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', flex: 1 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default Modal;