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
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-background/60 backdrop-blur-2xl z-40">
      <div className="p-6 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-accent/25"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-light), var(--color-accent-dark))',
          }}
        >
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
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
                  isActive
                    ? 'text-white'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                )}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className={cn('w-5 h-5 relative z-10', isActive && 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]')} />
                <span className="relative z-10 flex-1">{item.label}</span>
                {item.shortcut && (
                  <kbd className="relative z-10 text-[10px] text-muted/50 bg-surface px-1.5 py-0.5 rounded font-mono border border-border-subtle">
                    {item.shortcut}
                  </kbd>
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 mb-4">
        <div className="divider-glow mb-4" />
        <div className="glass-static noise-texture relative overflow-hidden p-4 rounded-xl">
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 30% 50%, rgba(139, 92, 246, 0.08), transparent 70%)',
            }}
          />
          <p className="text-xs text-muted relative z-10">Built for brains that work differently.</p>
          <p className="text-[10px] text-muted/40 mt-1.5 relative z-10 font-mono">v1.0.0</p>
        </div>
      </div>
    </aside>
  )
}
