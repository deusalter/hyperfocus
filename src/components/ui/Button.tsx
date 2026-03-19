'use client'

import { useRef, useCallback } from 'react'
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
}

const variants = {
  primary: 'bg-gradient-to-b from-accent-light to-accent-dark text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:brightness-110',
  secondary: 'glass text-foreground hover:bg-surface-hover',
  ghost: 'text-muted hover:text-foreground hover:bg-surface',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 hover:shadow-lg hover:shadow-danger/10',
}

const rippleColors = {
  primary: 'rgba(255, 255, 255, 0.35)',
  secondary: 'rgba(139, 92, 246, 0.15)',
  ghost: 'rgba(139, 92, 246, 0.12)',
  danger: 'rgba(239, 68, 68, 0.2)',
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
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const rippleX = e.clientX - rect.left
    const rippleY = e.clientY - rect.top

    // Calculate ripple size to cover the entire button from the click point
    const maxDist = Math.max(
      Math.hypot(rippleX, rippleY),
      Math.hypot(rect.width - rippleX, rippleY),
      Math.hypot(rippleX, rect.height - rippleY),
      Math.hypot(rect.width - rippleX, rect.height - rippleY)
    )
    const diameter = maxDist * 2

    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${rippleX - diameter / 2}px;
      top: ${rippleY - diameter / 2}px;
      background: ${rippleColors[variant]};
      border-radius: 50%;
      transform: scale(0);
      animation: button-ripple 0.5s ease-out forwards;
      pointer-events: none;
      z-index: 0;
    `

    button.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
  }, [disabled, variant])

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      onMouseDown={createRipple}
      type={type}
      disabled={disabled}
      className={cn(
        'font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 relative overflow-hidden',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  )
}
