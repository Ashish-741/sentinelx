/**
 * Card — Glassmorphism card with optional glow border, header, and body sections.
 */
import { motion } from 'framer-motion';

const glowColors = {
  blue: 'border-electric/20 hover:border-electric/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.15)] relative overflow-hidden group',
  green: 'border-neon/20 hover:border-neon/50 hover:shadow-[0_0_30px_rgba(0,255,136,0.15)] relative overflow-hidden group',
  red: 'border-danger/20 hover:border-danger/50 hover:shadow-[0_0_30px_rgba(255,51,102,0.15)] relative overflow-hidden group',
  purple: 'border-purple/20 hover:border-purple/50 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] relative overflow-hidden group',
  warning: 'border-warning/20 hover:border-warning/50 hover:shadow-[0_0_30px_rgba(255,170,0,0.15)] relative overflow-hidden group',
  none: 'border-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden group',
};

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  glow = 'none',
  className = '',
  headerAction,
  animate = true,
  onClick,
  ...props
}) {
  const Wrapper = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      }
    : {};

  return (
    <Wrapper
      onClick={onClick}
      className={`
        glass-card p-5 transition-all duration-300
        ${glowColors[glow]}
        ${onClick ? 'cursor-pointer hover:translate-y-[-2px]' : ''}
        ${className}
      `}
      {...animationProps}
      {...props}
    >
      {(title || Icon || headerAction) && (
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-electric/10 group-hover:bg-electric/20 transition-colors duration-300">
                <Icon className="w-5 h-5 text-electric group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="relative z-10">{children}</div>
      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-shimmer pointer-events-none" />
    </Wrapper>
  );
}
