/**
 * Button — Glassmorphism button with variants, sizes, loading state, and glow effects.
 */
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-electric/20 text-electric border-electric/30 hover:bg-electric/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
  secondary: 'bg-slate-800/60 text-slate-200 border-slate-600/30 hover:bg-slate-700/60 hover:border-slate-500/50',
  danger: 'bg-danger/20 text-danger border-danger/30 hover:bg-danger/30 hover:shadow-[0_0_20px_rgba(255,51,102,0.3)]',
  ghost: 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200',
  neon: 'bg-neon/20 text-neon border-neon/30 hover:bg-neon/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-xl
        border backdrop-blur-sm transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <motion.div 
          whileHover={{ x: 2, scale: 1.1 }} 
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
      ) : null}
      {children}
    </motion.button>
  );
}
