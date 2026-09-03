import React, { forwardRef, type HTMLAttributes } from 'react';

/**
 * Card Component - Flexible container following Web Interface Guidelines
 * 
 * Features:
 * - Semantic structure
 * - Proper heading hierarchy
 * - Interactive states for clickable cards
 * - Focus management
 * - Multiple variants
 * - Accessible by default
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'filled' | 'interactive';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Hover effect for interactive cards */
  hoverable?: boolean;
  /** Accessible label for interactive cards */
  ariaLabel?: string;
}

const baseCardStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 'var(--radius-card)',
  backgroundColor: 'var(--surface-secondary)',
  transition: 'var(--transition-all)',
  overflow: 'hidden',
};

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    border: '1px solid var(--surface-border)',
  },
  outlined: {
    border: '2px solid var(--surface-border-strong)',
  },
  elevated: {
    border: 'none',
    boxShadow: 'var(--shadow-lg)',
  },
  filled: {
    border: 'none',
    backgroundColor: 'var(--surface-tertiary)',
  },
  interactive: {
    border: '1px solid var(--surface-border)',
    cursor: 'pointer',
  },
};

const paddingStyles: Record<string, React.CSSProperties> = {
  none: { padding: 0 },
  sm: { padding: 'var(--space-3)' },
  md: { padding: 'var(--space-4)' },
  lg: { padding: 'var(--space-6)' },
  xl: { padding: 'var(--space-8)' },
};

const hoverStyles: React.CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: 'var(--shadow-xl)',
  borderColor: 'var(--brand-primary-medium)',
};

const focusStyles: React.CSSProperties = {
  outline: 'none',
  boxShadow: 'var(--shadow-focus)',
  borderColor: 'var(--brand-primary)',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      onClick,
      role = 'article',
      ariaLabel,
      children,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === 'interactive' || onClick;
    const variantStyle = variantStyles[variant] || variantStyles.default;
    const paddingStyle = paddingStyles[padding] || paddingStyles.md;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        (onClick as unknown as () => void)?.();
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
      if (isInteractive) {
        Object.assign(e.currentTarget.style, focusStyles);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      if (isInteractive) {
        Object.assign(e.currentTarget.style, variantStyle);
      }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable || isInteractive) {
        Object.assign(e.currentTarget.style, hoverStyles);
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable || isInteractive) {
        Object.assign(e.currentTarget.style, variantStyle);
      }
    };

    const combinedStyle: React.CSSProperties = {
      ...baseCardStyles,
      ...variantStyle,
      ...paddingStyle,
      ...style,
    };

    const Component = isInteractive ? 'div' : 'article';

    return (
      <Component
        ref={ref}
        role={isInteractive ? 'button' : role}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={isInteractive ? ariaLabel : undefined}
        style={combinedStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Semantic header for card
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Title text */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Action element (button, link, etc.) */
  action?: React.ReactNode;
  /** Avatar or icon */
  avatar?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, avatar, children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--surface-border)',
        ...style,
      }}
      {...props}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {avatar && (
          <div style={{ marginBottom: 'var(--space-2)' }}>
            {avatar}
          </div>
        )}
        {title && (
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--leading-tight)',
            textWrap: 'balance',
          }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            margin: 'var(--space-1) 0 0 0',
            lineHeight: 'var(--leading-normal)',
          }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div style={{ flexShrink: 0, marginLeft: 'var(--space-4)' }}>
          {action}
        </div>
      )}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

/**
 * CardContent - Main content area
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        flex: 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer with actions
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Align actions to end */
  alignEnd?: boolean;
  /** Divider above footer */
  divider?: boolean;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, alignEnd = true, divider = true, style, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: alignEnd ? 'flex-end' : 'flex-start',
        gap: 'var(--space-3)',
        paddingTop: 'var(--space-4)',
        marginTop: 'var(--space-2)',
        borderTop: divider ? '1px solid var(--surface-border)' : 'none',
        flexWrap: 'wrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

/**
 * CardPreview - Specialized card for data previews (KPIs, stats)
 */
export interface CardPreviewProps extends HTMLAttributes<HTMLDivElement> {
  /** Main value */
  value: string | number;
  /** Label/description */
  label: string;
  /** Trend indicator */
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
    label?: string;
  };
  /** Icon */
  icon?: React.ReactNode;
  /** Color variant for value */
  valueColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Compact mode */
  compact?: boolean;
}

export const CardPreview = ({
  value,
  label,
  trend,
  icon,
  valueColor = 'primary',
  compact = false,
  style,
  ...props
}: CardPreviewProps) => {
  const colorMap: Record<string, string> = {
    primary: 'var(--brand-primary)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
  };

  const trendColors: Record<string, string> = {
    up: 'var(--color-success)',
    down: 'var(--color-error)',
    neutral: 'var(--text-tertiary)',
  };

  const trendIcons: Record<string, string> = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card variant="default" padding={compact ? 'sm' : 'md'} style={style} {...props}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-wider)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: compact ? 'var(--text-xl)' : 'var(--text-3xl)',
            fontWeight: 'var(--font-bold)',
            color: colorMap[valueColor],
            margin: compact ? 'var(--space-1) 0' : 'var(--space-2) 0',
            lineHeight: 'var(--leading-tight)',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {value}
          </p>
          {trend && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-medium)',
              color: trendColors[trend.type],
            }}>
              <span aria-hidden="true">{trendIcons[trend.type]}</span>
              <span>{trend.value}</span>
              {trend.label && <span style={{ color: 'var(--text-tertiary)' }}>{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: compact ? '40px' : '48px',
            height: compact ? '40px' : '48px',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: `${colorMap[valueColor]}15`,
            color: colorMap[valueColor],
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;