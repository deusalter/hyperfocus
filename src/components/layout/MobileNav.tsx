'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Timer, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient fade above the nav for seamless blending */}
      <div
        className="h-6 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--color-background))',
        }}
      />
      {/* Gradient top border accent */}
      <div
        className="h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(139, 92, 246, 0.3) 50%, transparent 95%)',
        }}
      />
      <div
        className="bg-background/90 backdrop-blur-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around py-2.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href} className="relative">
                <motion.div
                  className={cn(
                    'flex flex-col items-center gap-1 px-3.5 py-2 rounded-xl transition-all duration-200',
                    isActive ? 'text-accent' : 'text-muted'
                  )}
                  whileTap={{ scale: 0.9 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileNav"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.08))',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.12)',
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={cn(
                    'w-[22px] h-[22px] relative z-10 transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                  )} />
                  <span className={cn(
                    'text-[10px] font-medium relative z-10 transition-all duration-200',
                    isActive && 'text-accent-light'
                  )}>{item.label}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
