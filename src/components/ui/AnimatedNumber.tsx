'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
}

export default function AnimatedNumber({ value, className, duration = 0.8 }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    duration: duration * 1000,
  })
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    motionValue.set(value)
    prevValue.current = value
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplay(Math.round(latest))
    })
    return unsubscribe
  }, [spring])

  return (
    <motion.span
      className={className}
      key={value}
      initial={prevValue.current !== value ? { scale: 1.15 } : false}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {display}
    </motion.span>
  )
}
