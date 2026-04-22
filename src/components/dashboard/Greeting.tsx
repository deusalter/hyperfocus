import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { format } from 'date-fns'
import { getGreeting } from '@/lib/utils'

export default function Greeting() {
  const [greeting, setGreeting] = useState('Hello')
  const [date, setDate] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    setDate(format(new Date(), 'EEEE, MMMM d'))
  }, [])

  return (
    <View className="mb-8">
      <Text className="text-[11px] font-mono uppercase tracking-widest text-muted mb-2">
        {date}
      </Text>
      <Text
        className="text-foreground text-[44px] leading-tight"
        style={{ fontFamily: 'Georgia', fontStyle: 'italic', letterSpacing: -0.5 }}
      >
        {greeting}
        <Text className="text-accent">.</Text>
      </Text>
      <Text className="text-muted text-sm mt-2">
        Capture what&apos;s in your head. Pick one thing. Start.
      </Text>
    </View>
  )
}
