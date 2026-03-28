'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Timer, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, shortcut: 'N' },
  { href: '/focus', label: 'Focus', icon: Timer, shortcut: 'T' },
  { href: '/stats', label: 'Stats', icon: BarChart3, shortcut: 'S' },
  { href: '/settings', label: 'Settings', icon: Settings, shortcut: '' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background z-40">
      <div className="px-6 pt-7 pb-6 flex items-baseline gap-2.5">
        <span
          className="display-xl text-[28px]"
          style={{ color: 'var(--color-foreground)' }}
        >
          hyperfocus
        </span>
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full mb-1"
          style={{ background: 'var(--color-accent)' }}
        />
      </div>

      <nav aria-label="Main navigation" className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href} aria-current={isActive ? 'page' : undefined}>
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium relative transition-colors duration-150',
                  isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5"
                    style={{ background: 'var(--color-accent)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] relative z-10 shrink-0" />
                <span className="relative z-10 flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd className="relative z-10 text-[10px] text-muted/60 font-mono">
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mx-5 mb-5">
        <div className="hairline mb-4" />
        <p className="text-[11px] text-muted leading-relaxed">Built for brains<br/>that work differently.</p>
        <p className="text-[10px] text-muted/40 mt-2 font-mono">v1.0.0</p>
      </div>
    </aside>
  )
}
