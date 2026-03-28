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
      <div
        className="ambient-gradient fixed top-0 left-0 right-0 h-[340px] pointer-events-none z-0"
        aria-hidden="true"
      />
      <ServiceWorkerRegistration />
      <Sidebar />
      <MobileNav />
      <main id="main-content" className="md:ml-64 min-h-screen pb-24 md:pb-0 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 md:p-10 max-w-4xl mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
