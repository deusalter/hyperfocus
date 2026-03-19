'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  onClick?: () => void
}

export default function Card({ children, className, hover = true, glow = false, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className={cn(
        'glass p-5 transition-all duration-300 ease-out',
        hover && 'hover:scale-[1.015] hover:-translate-y-0.5',
        glow && 'glow',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
