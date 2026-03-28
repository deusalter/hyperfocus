'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Timer, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/focus', label: 'Focus', icon: Timer },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div
        className="h-6 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--color-background))' }}
      />
      <div
        className="border-t border-border bg-background"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex-1"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'flex flex-col items-center gap-1 pt-2.5 pb-2 relative',
                    isActive ? 'text-foreground' : 'text-muted'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileNav"
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8"
                      style={{ background: 'var(--color-accent)' }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <Icon className="w-[20px] h-[20px] relative z-10" />
                  <span className="text-[10px] font-medium relative z-10">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
