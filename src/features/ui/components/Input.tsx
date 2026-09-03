import React, { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';

/**
 * Input Component - Accessible form input following Web Interface Guidelines
 * 
 * Features:
 * - Proper label association
 * - Focus-visible states
 * - Error state with aria-describedby
 * - Helper text support
 * - Icon support (start/end)
 * - Autocomplete attributes
 * - Touch-friendly sizing
 */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Icon at start of input */
  startIcon?: React.ReactNode;
  /** Icon at end of input */
  endIcon?: React.ReactNode;
  /** Input variant */
  variant?: 'default' | 'filled' | 'outlined';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Visually hide label (but keep for screen readers) */
  hideLabel?: boolean;
}

const baseInputStyles: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  lineHeight: 'var(--leading-normal)',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--surface-secondary)',
  border: '1px solid var(--surface-border)',
  borderRadius: 'var(--radius-input)',
  transition: 'var(--transition-colors), var(--transition-shadow)',
  outline: 'none',
  boxSizing: 'border-box',
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: {
    height: '36px',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-sm)',
  },
  md: {
    height: '44px',
    padding: '0 var(--space-3)',
    fontSize: 'var(--text-base)',
  },
  lg: {
    height: '52px',
    padding: '0 var(--space-4)',
    fontSize: 'var(--text-lg)',
  },
};

const variantStyles: Record<string, React.CSSProperties> = {
  default: {},
  filled: {
    backgroundColor: 'var(--surface-tertiary)',
    borderColor: 'transparent',
  },
  outlined: {
    borderWidth: '2px',
  },
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--font-medium)',
  color: 'var(--text-secondary)',
  marginBottom: 'var(--space-1)',
};

const helperTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
  marginTop: 'var(--space-1)',
};

const errorTextStyles: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-error)',
  marginTop: 'var(--space-1)',
};

const wrapperStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-1)',
  width: '100%',
};

const inputWrapperStyles: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyles: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-tertiary)',
  pointerEvents: 'none',
  flexShrink: 0,
  width: '20px',
  height: '20px',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      variant = 'default',
      size = 'md',
      fullWidth = true,
      hideLabel = false,
      id,
      className,
      style,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const sizeStyle = sizeStyles[size] || sizeStyles.md;
    const variantStyle = variantStyles[variant] || variantStyles.default;

    const combinedInputStyle: React.CSSProperties = {
      ...baseInputStyles,
      ...sizeStyle,
      ...variantStyle,
      ...(error && { borderColor: 'var(--color-error)' }),
      ...(disabled && { opacity: 0.5, cursor: 'not-allowed' }),
      ...(startIcon && { paddingLeft: '40px' }),
      ...(endIcon && { paddingRight: '40px' }),
      ...style,
    };

    const focusStyle: React.CSSProperties = {
      borderColor: error ? 'var(--color-error)' : 'var(--brand-primary)',
      boxShadow: error 
        ? '0 0 0 3px var(--color-error-light)' 
        : 'var(--shadow-focus)',
    };

    return (
      <div style={{ ...wrapperStyles, ...(fullWidth ? { width: '100%' } : {}) }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              ...labelStyles,
              ...(hideLabel && {
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }),
            }}
          >
            {label}
            {required && <span aria-hidden="true" style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <div style={inputWrapperStyles}>
          {startIcon && (
            <span style={{ ...iconStyles, left: 'var(--space-3)' }} aria-hidden="true">
              {startIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            onFocus={(e) => {
              Object.assign(e.currentTarget.style, focusStyle);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              Object.assign(e.currentTarget.style, combinedInputStyle);
              props.onBlur?.(e);
            }}
            style={combinedInputStyle}
            {...props}
          />
          {endIcon && (
            <span style={{ ...iconStyles, right: 'var(--space-3)' }} aria-hidden="true">
              {endIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" style={errorTextStyles}>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} style={helperTextStyles}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  hideLabel?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'default',
      size = 'md',
      fullWidth = true,
      hideLabel = false,
      rows = 4,
      id,
      style,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText && !error ? `${textareaId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const sizeStyle = sizeStyles[size] || sizeStyles.md;
    const variantStyle = variantStyles[variant] || variantStyles.default;

    const combinedStyle: React.CSSProperties = {
      ...baseInputStyles,
      ...sizeStyle,
      ...variantStyle,
      ...(error && { borderColor: 'var(--color-error)' }),
      ...(disabled && { opacity: 0.5, cursor: 'not-allowed' }),
      minHeight: `${rows * 2.5}rem`,
      resize: 'vertical',
      padding: 'var(--space-3)',
      ...style,
    };

    const focusStyle: React.CSSProperties = {
      borderColor: error ? 'var(--color-error)' : 'var(--brand-primary)',
      boxShadow: error 
        ? '0 0 0 3px var(--color-error-light)' 
        : 'var(--shadow-focus)',
    };

    return (
      <div style={{ ...wrapperStyles, ...(fullWidth ? { width: '100%' } : {}) }}>
        {label && (
          <label
            htmlFor={textareaId}
            style={{
              ...labelStyles,
              ...(hideLabel && {
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }),
            }}
          >
            {label}
            {required && <span aria-hidden="true" style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          onFocus={(e) => {
            Object.assign(e.currentTarget.style, focusStyle);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            Object.assign(e.currentTarget.style, combinedStyle);
            props.onBlur?.(e);
          }}
          style={combinedStyle}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" style={errorTextStyles}>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} style={helperTextStyles}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * Select Component
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'default',
      size = 'md',
      fullWidth = true,
      hideLabel = false,
      placeholder,
      options,
      id,
      style,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || React.useId();
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText && !error ? `${selectId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const sizeStyle = sizeStyles[size] || sizeStyles.md;
    const variantStyle = variantStyles[variant] || variantStyles.default;

    const combinedStyle: React.CSSProperties = {
      ...baseInputStyles,
      ...sizeStyle,
      ...variantStyle,
      ...(error && { borderColor: 'var(--color-error)' }),
      ...(disabled && { opacity: 0.5, cursor: 'not-allowed' }),
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right var(--space-3) center',
      paddingRight: 'var(--space-10)',
      ...style,
    };

    const focusStyle: React.CSSProperties = {
      borderColor: error ? 'var(--color-error)' : 'var(--brand-primary)',
      boxShadow: error 
        ? '0 0 0 3px var(--color-error-light)' 
        : 'var(--shadow-focus)',
    };

    return (
      <div style={{ ...wrapperStyles, ...(fullWidth ? { width: '100%' } : {}) }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              ...labelStyles,
              ...(hideLabel && {
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }),
            }}
          >
            {label}
            {required && <span aria-hidden="true" style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          onFocus={(e) => {
            Object.assign(e.currentTarget.style, focusStyle);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            Object.assign(e.currentTarget.style, combinedStyle);
            props.onBlur?.(e);
          }}
          style={combinedStyle}
          {...props}
        >
          {placeholder && (
            <option value="" disabled selected hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" style={errorTextStyles}>
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} style={helperTextStyles}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Label Component - Standalone accessible label
 */
export interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hideVisually?: boolean;
}

export const Label = ({ htmlFor, children, required, size = 'md', hideVisually = false }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      fontSize: size === 'sm' ? 'var(--text-xs)' : size === 'lg' ? 'var(--text-base)' : 'var(--text-sm)',
      fontWeight: 'var(--font-medium)',
      color: 'var(--text-secondary)',
      marginBottom: 'var(--space-1)',
      ...(hideVisually && {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }),
    }}
  >
    {children}
    {required && <span aria-hidden="true" style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
  </label>
);

export default Input;