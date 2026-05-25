/**
 * LoadingSpinner — Animated cyber-themed loading spinner.
 */
import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', text = '', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const strokeWidth = { sm: 3, md: 3, lg: 2.5, xl: 2 };
  const dim = { sm: 24, md: 40, lg: 64, xl: 96 };
  const r = (dim[size] - strokeWidth[size] * 2) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        {/* Outer ring */}
        <motion.svg
          className="absolute inset-0"
          viewBox={`0 0 ${dim[size]} ${dim[size]}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={dim[size] / 2}
            cy={dim[size] / 2}
            r={r}
            fill="none"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth={strokeWidth[size]}
          />
          <circle
            cx={dim[size] / 2}
            cy={dim[size] / 2}
            r={r}
            fill="none"
            stroke="#00d4ff"
            strokeWidth={strokeWidth[size]}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.5))' }}
          />
        </motion.svg>

        {/* Inner ring (counter-rotate) */}
        <motion.svg
          className="absolute inset-0"
          viewBox={`0 0 ${dim[size]} ${dim[size]}`}
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx={dim[size] / 2}
            cy={dim[size] / 2}
            r={r * 0.65}
            fill="none"
            stroke="#7c3aed"
            strokeWidth={strokeWidth[size] * 0.7}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.65 * 0.2} ${circumference * 0.65 * 0.8}`}
            style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.5))' }}
          />
        </motion.svg>

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-electric shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
        </motion.div>
      </div>

      {text && (
        <p className="text-sm text-slate-400 font-mono tracking-wider animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
