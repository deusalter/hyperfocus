'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ServiceWorkerRegistration from './ServiceWorkerRegistration'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useKeyboardShortcuts()

  return (
    <div className="min-h-screen relative">
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div className="ambient-gradient fixed top-0 left-0 right-0 h-[400px] pointer-events-none opacity-50 z-0" aria-hidden="true" />
      <ServiceWorkerRegistration />
      <Sidebar />
      <MobileNav />
      <main id="main-content" className="md:ml-64 min-h-screen pb-20 md:pb-0 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="p-4 md:p-8 max-w-5xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
