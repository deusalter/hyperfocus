'use client'

import Odometer from './Odometer'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
}

export default function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  return <Odometer value={value} className={className} />
}
