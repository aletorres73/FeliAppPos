import React, { forwardRef, type HTMLAttributes, type ButtonHTMLAttributes } from 'react';

/**
 * Badge Component - Status indicators and labels
 * 
 * Features:
 * - Multiple variants and sizes
 * - Accessible color contrast
 * - Dot indicator variant
 * - Removable badges
 */

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show dot indicator */
  dot?: boolean;
  /** Dot color (overrides variant) */
  dotColor?: string;
  /** Removable badge */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Remove button aria-label */
  removeAriaLabel?: string;
}

const baseBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--font-semibold)',
  borderRadius: 'var(--radius-badge)',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  lineHeight: 1,
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    padding: 'var(--space-1) var(--space-2)',
    fontSize: 'var(--text-xs)',
    height: '20px',
  },
  md: {
    padding: 'var(--space-1) var(--space-2.5)',
    fontSize: 'var(--text-sm)',
    height: '24px',
  },
  lg: {
    padding: 'var(--space-1.5) var(--space-3)',
    fontSize: 'var(--text-base)',
    height: '28px',
  },
};

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    backgroundColor: 'var(--surface-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--surface-border)',
  },
  primary: {
    backgroundColor: 'var(--brand-primary-light)',
    color: 'var(--brand-primary)',
    border: '1px solid var(--brand-primary-medium)',
  },
  secondary: {
    backgroundColor: 'var(--brand-secondary-light)',
    color: 'var(--brand-secondary)',
    border: '1px solid var(--brand-secondary-medium)',
  },
  success: {
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)',
    border: '1px solid var(--color-success-medium)',
  },
  warning: {
    backgroundColor: 'var(--color-warning-light)',
    color: '#856404',
    border: '1px solid var(--color-warning-medium)',
  },
  error: {
    backgroundColor: 'var(--color-error-light)',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error-medium)',
  },
  info: {
    backgroundColor: 'var(--color-info-light)',
    color: 'var(--color-info)',
    border: '1px solid var(--color-info-medium)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--surface-border-strong)',
  },
};

const dotStyles: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: 'var(--radius-full)',
  flexShrink: 0,
};

const removeButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'transparent',
  color: 'inherit',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginLeft: 'var(--space-1)',
  opacity: 0.7,
  transition: 'var(--transition-colors)',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      dotColor,
      removable = false,
      onRemove,
      removeAriaLabel = 'Eliminar',
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantStyles[variant] || variantStyles.default;
    const sizeStyle = sizeStyles[size] || sizeStyles.md;

    const combinedStyle: React.CSSProperties = {
      ...baseBadgeStyles,
      ...variantStyle,
      ...sizeStyle,
      ...style,
    };

    return (
      <span ref={ref} style={combinedStyle} {...props}>
        {dot && (
          <span
            style={{
              ...dotStyles,
              backgroundColor: dotColor || variantStyle.color,
            }}
            aria-hidden="true"
          />
        )}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={removeButtonStyles}
            aria-label={removeAriaLabel}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, { opacity: 1, backgroundColor: 'rgba(0,0,0,0.1)' });
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, removeButtonStyles);
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * StatusBadge - Specialized badge for status indicators
 */
export interface StatusBadgeProps {
  /** Status value */
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'processing';
  /** Custom label */
  label?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show dot */
  showDot?: boolean;
}

export const StatusBadge = ({ status, label, size = 'md', showDot = true }: StatusBadgeProps) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; dotColor?: string }> = {
    active: { variant: 'success', label: 'Activo' },
    inactive: { variant: 'default', label: 'Inactivo' },
    pending: { variant: 'warning', label: 'Pendiente' },
    success: { variant: 'success', label: 'Éxito' },
    warning: { variant: 'warning', label: 'Advertencia' },
    error: { variant: 'error', label: 'Error' },
    processing: { variant: 'info', label: 'Procesando' },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} size={size} dot={showDot} dotColor={config.dotColor}>
      {label || config.label}
    </Badge>
  );
};

/**
 * Tag - Interactive tag/filter component
 */
export interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected state */
  selected?: boolean;
  /** Removable */
  removable?: boolean;
  /** Remove handler */
  onRemove?: () => void;
  /** Icon */
  icon?: React.ReactNode;
}

export const Tag = forwardRef<HTMLButtonElement, TagProps>(
  (
    {
      selected = false,
      removable = false,
      onRemove,
      icon,
      children,
      onClick,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      padding: 'var(--space-1) var(--space-2)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      borderRadius: 'var(--radius-badge)',
      border: '1px solid var(--surface-border)',
      backgroundColor: selected ? 'var(--brand-primary-light)' : 'var(--surface-secondary)',
      color: selected ? 'var(--brand-primary)' : 'var(--text-secondary)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'var(--transition-all)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      ...style,
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !removable) {
        onClick?.(e);
      }
    };

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onRemove?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={handleClick}
        style={baseStyle}
        {...props}
      >
        {icon && <span style={{ display: 'flex' }}>{icon}</span>}
        {children}
        {removable && (
          <button
            type="button"
            onClick={handleRemove}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'transparent',
              color: 'inherit',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginLeft: 'var(--space-1)',
              opacity: 0.7,
            }}
            aria-label="Eliminar etiqueta"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </button>
    );
  }
);

Tag.displayName = 'Tag';

export default Badge;