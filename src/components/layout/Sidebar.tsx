'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Timer, BarChart3, Settings, Zap } from 'lucide-react'
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
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background/50 backdrop-blur-xl z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Hyperfocus</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 relative',
                  isActive
                    ? 'text-white'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                )}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-accent/15 border border-accent/20 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="relative z-10 flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd className="relative z-10 text-[10px] text-muted/50 bg-surface px-1.5 py-0.5 rounded font-mono">
                    {item.shortcut}
                  </kbd>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mx-3 mb-4 glass rounded-xl">
        <p className="text-xs text-muted">Built for brains that work differently.</p>
      </div>
    </aside>
  )
}
