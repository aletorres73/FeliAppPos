import React, { forwardRef, type ImgHTMLAttributes } from 'react';

/**
 * Avatar Component - User/profile images with fallbacks
 * 
 * Features:
 * - Multiple sizes
 * - Fallback to initials
 * - Status indicator
 * - Group/stacked avatars
 * - Accessible alt text
 */

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Image source */
  src?: string | null;
  /** Alt text (required for accessibility) */
  alt?: string;
  /** Fallback name for initials */
  name?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Shape */
  shape?: 'circle' | 'square' | 'rounded';
  /** Status indicator */
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  /** Status position */
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Border */
  bordered?: boolean;
  /** Border color */
  borderColor?: string;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  xs: { width: '24px', height: '24px', fontSize: 'var(--text-xs)' },
  sm: { width: '32px', height: '32px', fontSize: 'var(--text-sm)' },
  md: { width: '40px', height: '40px', fontSize: 'var(--text-base)' },
  lg: { width: '56px', height: '56px', fontSize: 'var(--text-lg)' },
  xl: { width: '72px', height: '72px', fontSize: 'var(--text-xl)' },
  '2xl': { width: '96px', height: '96px', fontSize: 'var(--text-2xl)' },
};

const shapeStyles: Record<string, React.CSSProperties> = {
  circle: { borderRadius: 'var(--radius-full)' },
  square: { borderRadius: 'var(--radius-md)' },
  rounded: { borderRadius: 'var(--radius-xl)' },
};

const statusSizeMap: Record<string, number> = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  '2xl': 18,
};

const statusColors: Record<string, string> = {
  online: 'var(--color-success)',
  offline: 'var(--text-tertiary)',
  busy: 'var(--color-error)',
  away: 'var(--color-warning)',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    'var(--brand-primary)',
    'var(--brand-secondary)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-error)',
    'var(--color-info)',
    'var(--brand-accent)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      status = null,
      statusPosition = 'bottom-right',
      bordered = false,
      borderColor,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const sizeStyle = sizeStyles[size] || sizeStyles.md;
    const shapeStyle = shapeStyles[shape] || shapeStyles.circle;
    const statusSize = statusSizeMap[size] || statusSizeMap.md;

    const hasImage = src && src.length > 0;
    const initials = name ? getInitials(name) : '?';
    const bgColor = name ? getColorFromName(name) : 'var(--surface-tertiary)';
    const textColor = name ? 'var(--text-inverse)' : 'var(--text-tertiary)';

    const containerStyle: React.CSSProperties = {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      backgroundColor: bgColor,
      color: textColor,
      fontWeight: 'var(--font-semibold)',
      lineHeight: 1,
      ...sizeStyle,
      ...shapeStyle,
      ...(bordered && {
        border: `2px solid ${borderColor || 'var(--surface-border)'}`,
      }),
      ...style,
    };

    const imageStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };

    const statusStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${statusSize}px`,
      height: `${statusSize}px`,
      borderRadius: 'var(--radius-full)',
      border: `2px solid var(--surface-secondary)`,
      backgroundColor: statusColors[status || 'offline'],
      ...(statusPosition.includes('bottom') ? { bottom: '-2px' } : { top: '-2px' }),
      ...(statusPosition.includes('right') ? { right: '-2px' } : { left: '-2px' }),
    };

    return (
      <div ref={ref} style={containerStyle} {...props}>
        {hasImage ? (
          <img
            src={src}
            alt={alt || (name ? `Avatar de ${name}` : 'Avatar')}
            style={imageStyle}
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
        {status && (
          <span
            style={statusStyle}
            aria-label={`Estado: ${status}`}
            role="img"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * AvatarGroup - Stacked avatars for teams/groups
 */
export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: Array<AvatarProps & { key: string }>;
  /** Maximum avatars to show */
  max?: number;
  /** Size */
  size?: AvatarProps['size'];
  /** Overlap spacing */
  overlap?: number;
  /** Total count badge (shown after max) */
  showTotalCount?: boolean;
  /** Total count */
  totalCount?: number;
}

export const AvatarGroup = ({
  avatars,
  max = 5,
  size = 'md',
  overlap = 8,
  showTotalCount = true,
  totalCount,
}: AvatarGroupProps) => {
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const avatarSize = parseInt(sizeStyle.width as string, 10);
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = totalCount !== undefined ? totalCount - max : avatars.length - max;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
      role="group"
      aria-label={`${avatars.length} usuarios`}
    >
      {visibleAvatars.map((avatar, index) => {
        const { key: avatarKey, ...restAvatar } = avatar;
        return (
          <Avatar
            key={avatarKey}
            {...restAvatar}
            size={size}
            style={{
              ...avatar.style,
              marginLeft: index === 0 ? 0 : `-${overlap}px`,
              zIndex: visibleAvatars.length - index,
              border: '2px solid var(--surface-secondary)',
              boxShadow: index > 0 ? 'var(--shadow-sm)' : 'none',
            }}
          />
        );
      })}
      {showTotalCount && remainingCount > 0 && (
        <div
          style={{
            marginLeft: `-${overlap}px`,
            width: `${avatarSize}px`,
            height: `${avatarSize}px`,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--surface-tertiary)',
            border: '2px solid var(--surface-secondary)',
            color: 'var(--text-secondary)',
            fontSize: sizeStyle.fontSize,
            fontWeight: 'var(--font-semibold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0,
          }}
          aria-label={`${remainingCount} usuarios más`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

/**
 * AvatarStack - Vertical stack of avatars
 */
export interface AvatarStackProps {
  avatars: Array<AvatarProps & { key: string }>;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: number;
}

export const AvatarStack = ({
  avatars,
  max = 5,
  size = 'md',
  spacing = 4,
}: AvatarStackProps) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing}px`,
      }}
      role="group"
      aria-label={`${avatars.length} usuarios`}
    >
      {visibleAvatars.map((avatar) => {
        const { key: avatarKey, ...restAvatar } = avatar;
        return <Avatar key={avatarKey} {...restAvatar} size={size} />;
      })}
      {remainingCount > 0 && (
        <Avatar
          src={null}
          name={`+${remainingCount}`}
          size={size}
          style={{ opacity: 0.6 }}
        />
      )}
    </div>
  );
};

export default Avatar;