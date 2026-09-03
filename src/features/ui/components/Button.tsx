import React, { forwardRef, type ButtonHTMLAttributes } from 'react';

/**
 * Button Component - Accessible, themeable button following Web Interface Guidelines
 * 
 * Features:
 * - Semantic <button> element
 * - Proper focus-visible states
 * - Touch-friendly minimum 44x44px targets
 * - Loading state with aria-busy
 * - Disabled state handling
 * - Multiple variants and sizes
 * - Icon support with proper aria-hidden
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show loading spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon to show before content (start) */
  startIcon?: React.ReactNode;
  /** Icon to show after content (end) */
  endIcon?: React.ReactNode;
  /** Visually hide the text content (icon-only button) */
  iconOnly?: boolean;
  /** Accessible label for icon-only buttons */
  ariaLabel?: string;
}

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--font-semibold)',
  borderRadius: 'var(--radius-button)',
  border: 'none',
  cursor: 'pointer',
  transition: 'var(--transition-all)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  position: 'relative',
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    height: '36px',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-sm)',
    minWidth: '36px',
  },
  md: {
    height: '44px',
    padding: '0 var(--space-4)',
    fontSize: 'var(--text-base)',
    minWidth: '44px',
  },
  lg: {
    height: '52px',
    padding: '0 var(--space-6)',
    fontSize: 'var(--text-lg)',
    minWidth: '52px',
  },
  xl: {
    height: '60px',
    padding: '0 var(--space-8)',
    fontSize: 'var(--text-xl)',
    minWidth: '60px',
  },
};

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--brand-primary)',
    color: 'var(--text-inverse)',
    boxShadow: 'var(--shadow-sm)',
  },
  secondary: {
    backgroundColor: 'var(--brand-secondary)',
    color: 'var(--text-inverse)',
    boxShadow: 'var(--shadow-sm)',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--brand-primary)',
    border: '2px solid var(--brand-primary)',
    boxShadow: 'none',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    boxShadow: 'none',
  },
  danger: {
    backgroundColor: 'var(--color-error)',
    color: 'var(--text-inverse)',
    boxShadow: 'var(--shadow-sm)',
  },
  success: {
    backgroundColor: 'var(--color-success)',
    color: 'var(--text-inverse)',
    boxShadow: 'var(--shadow-sm)',
  },
};

const variantHoverStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--brand-primary-hover)' },
  secondary: { backgroundColor: 'var(--brand-secondary-hover)' },
  outline: { backgroundColor: 'var(--brand-primary-light)' },
  ghost: { backgroundColor: 'var(--surface-hover)' },
  danger: { backgroundColor: 'var(--color-error-hover)' },
  success: { backgroundColor: '#3d8b40' },
};

const variantActiveStyles: Record<string, React.CSSProperties> = {
  primary: { backgroundColor: 'var(--brand-primary-active)', transform: 'scale(0.98)' },
  secondary: { backgroundColor: 'var(--brand-secondary-active)', transform: 'scale(0.98)' },
  outline: { backgroundColor: 'var(--brand-primary-medium)', transform: 'scale(0.98)' },
  ghost: { backgroundColor: 'var(--surface-active)', transform: 'scale(0.98)' },
  danger: { backgroundColor: '#cc3d3d', transform: 'scale(0.98)' },
  success: { backgroundColor: '#357a38', transform: 'scale(0.98)' },
};

const variantFocusStyles: Record<string, React.CSSProperties> = {
  primary: { boxShadow: 'var(--shadow-sm), var(--shadow-focus)' },
  secondary: { boxShadow: 'var(--shadow-sm), var(--shadow-focus)' },
  outline: { boxShadow: 'var(--shadow-focus)' },
  ghost: { boxShadow: 'var(--shadow-focus)' },
  danger: { boxShadow: 'var(--shadow-sm), var(--shadow-focus)' },
  success: { boxShadow: 'var(--shadow-sm), var(--shadow-focus)' },
};

const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

const loadingStyles: React.CSSProperties = {
  position: 'relative',
  color: 'transparent',
  pointerEvents: 'none',
};

const spinnerStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1em',
  height: '1em',
  border: '2px solid currentColor',
  borderRightColor: 'transparent',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
  color: 'inherit',
};

const iconStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '1em',
  height: '1em',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      startIcon,
      endIcon,
      iconOnly = false,
      ariaLabel,
      children,
      disabled,
      className,
      style,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const variantStyle = variantStyles[variant] || variantStyles.primary;
    const hoverStyle = variantHoverStyles[variant] || variantHoverStyles.primary;
    const activeStyle = variantActiveStyles[variant] || variantActiveStyles.primary;
    const focusStyle = variantFocusStyles[variant] || variantFocusStyles.primary;
    const sizeStyle = sizeStyles[size] || sizeStyles.md;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
      }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, hoverStyle);
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, variantStyle);
      }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, activeStyle);
      }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, hoverStyle);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, focusStyle);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        Object.assign(e.currentTarget.style, variantStyle);
      }
    };

    const combinedStyle: React.CSSProperties = {
      ...baseStyles,
      ...sizeStyle,
      ...variantStyle,
      ...(fullWidth && { width: '100%' }),
      ...(isDisabled && disabledStyles),
      ...(loading && loadingStyles),
      ...style,
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        aria-label={iconOnly ? ariaLabel : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={combinedStyle}
        {...props}
      >
        {loading && (
          <svg
            className="button-spinner"
            viewBox="0 0 24 24"
            style={spinnerStyles}
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
          </svg>
        )}
        {!loading && startIcon && (
          <span style={iconStyles} aria-hidden="true">
            {startIcon}
          </span>
        )}
        {!iconOnly && children}
        {!loading && endIcon && !iconOnly && (
          <span style={iconStyles} aria-hidden="true">
            {endIcon}
          </span>
        )}
        {iconOnly && !loading && (
          <span style={iconStyles} aria-hidden="true">
            {startIcon || endIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - Specialized button for icon-only actions
 * Ensures proper accessibility with aria-label
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'iconOnly'> {
  /** Required accessible label for icon-only button */
  ariaLabel: string;
  /** Icon to display */
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ ariaLabel, icon, size = 'md', variant = 'ghost', ...props }, ref) => (
    <Button
      ref={ref}
      iconOnly
      ariaLabel={ariaLabel}
      size={size}
      variant={variant}
      startIcon={icon}
      {...props}
    />
  )
);

IconButton.displayName = 'IconButton';

/**
 * ButtonGroup - Groups related buttons together
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  ariaLabel?: string;
  vertical?: boolean;
}

export const ButtonGroup = ({ children, ariaLabel, vertical = false }: ButtonGroupProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    style={{
      display: vertical ? 'flex' : 'inline-flex',
      flexDirection: vertical ? 'column' : 'row',
      gap: 0,
      borderRadius: 'var(--radius-button)',
      overflow: 'hidden',
      isolation: 'isolate',
    }}
  >
    {React.Children.map(children, (child, index) => {
      if (!React.isValidElement<ButtonProps>(child)) return child;
      
      return React.cloneElement(child, {
        style: {
          ...(child.props.style || {}),
          borderRadius: 0,
          margin: 0,
          ...(index === 0 && {
            borderTopLeftRadius: 'var(--radius-button)',
            borderBottomLeftRadius: vertical ? 0 : 'var(--radius-button)',
            borderTopRightRadius: vertical ? 'var(--radius-button)' : 0,
          }),
          ...(index === React.Children.count(children) - 1 && {
            borderTopRightRadius: 'var(--radius-button)',
            borderBottomRightRadius: vertical ? 'var(--radius-button)' : 0,
            borderTopLeftRadius: vertical ? 0 : 'var(--radius-button)',
          }),
        },
      });
    })}
  </div>
);

export default Button;