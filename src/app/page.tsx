'use client'

import Greeting from '@/components/dashboard/Greeting'
import QuickStats from '@/components/dashboard/QuickStats'
import QuickCapture from '@/components/dashboard/QuickCapture'
import TodayTasks from '@/components/dashboard/TodayTasks'

export default function Dashboard() {
  return (
    <div>
      <Greeting />
      <QuickStats />
      <QuickCapture />
      <TodayTasks />
    </div>
  )
}
