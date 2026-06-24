interface SundewLogoProps {
  size?: number;
  variant?: 'icon' | 'full';
  showTagline?: boolean;
  className?: string;
}

export function SundewLogo({
  size = 40,
  variant = 'icon',
  showTagline = false,
  className = '',
}: SundewLogoProps) {
  if (variant === 'full') {
    return (
      <div className={`sundew-logo-full ${className}`.trim()}>
        <img
          src="/sundew-full-logo.png"
          alt="Sundew"
          className="sundew-logo-full-image"
          style={{ height: size }}
        />
        {showTagline && <span className="sundew-logo-tagline">Digital first. Digital fast.</span>}
      </div>
    );
  }

  return (
    <img
      src="/sundew-logo.png"
      alt="Sundew"
      className={`sundew-logo-icon ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}

export function SundewElevateWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`sundew-elevate-wordmark${compact ? ' compact' : ''}`}>
      <SundewLogo size={compact ? 32 : 38} />
      <div className="sundew-elevate-wordmark-text">
        <span className="sundew-elevate-name">
          Sundew <em>Elevate</em>
        </span>
        {!compact && <span className="sundew-elevate-tagline">Digital first. Digital fast.</span>}
      </div>
    </div>
  );
}
