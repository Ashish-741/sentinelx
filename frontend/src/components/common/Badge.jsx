/**
 * Badge — Status badges with semantic colors.
 */
const badgeVariants = {
  safe: 'bg-neon/10 text-neon border-neon/20',
  suspicious: 'bg-warning/10 text-warning border-warning/20',
  dangerous: 'bg-danger/10 text-danger border-danger/20',
  critical: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-electric/10 text-electric border-electric/20',
  purple: 'bg-purple/10 text-purple border-purple/20',
  neutral: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  success: 'bg-neon/10 text-neon border-neon/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  secondary: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
};

const dotColors = {
  safe: 'bg-neon',
  suspicious: 'bg-warning',
  dangerous: 'bg-danger',
  critical: 'bg-danger',
  info: 'bg-electric',
  purple: 'bg-purple',
  neutral: 'bg-slate-400',
  success: 'bg-neon',
  warning: 'bg-warning',
  danger: 'bg-danger',
  secondary: 'bg-slate-400',
};

export default function Badge({ children, variant = 'info', dot = false, pulse = false, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        text-xs font-medium rounded-full border
        ${badgeVariants[variant]} ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dotColors[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
}
