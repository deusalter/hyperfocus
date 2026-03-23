'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  'aria-label'?: string
}

const variants = {
  primary:
    'bg-accent text-[color:var(--color-accent-ink)] border border-accent hover:bg-accent-light hover:border-accent-light',
  secondary:
    'bg-surface text-foreground border border-border hover:border-border-hover hover:bg-surface-hover',
  ghost:
    'text-muted border border-transparent hover:text-foreground hover:bg-surface',
  danger:
    'bg-transparent text-danger border border-danger/30 hover:bg-danger/10 hover:border-danger/60',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'font-medium inline-flex items-center justify-center gap-2 transition-colors duration-150 ease-out',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
