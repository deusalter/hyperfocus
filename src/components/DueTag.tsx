import { Text, View } from 'react-native'
import { palette } from '@/lib/theme'
import { dueChip } from '@/lib/tasks'

/**
 * A task's date, small. An overdue one is stated in the warm "past due" text
 * colour with no alarm shape around it: a date is a fact, not a verdict.
 */
export default function DueTag({ due, today }: { due: string; today: string }) {
  const { text, overdue } = dueChip(due, today)
  return (
    <View
      className="rounded-[9px]"
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: overdue ? 'transparent' : palette.background,
      }}
      accessible
      accessibilityLabel={overdue ? `Was due ${text}` : `Due ${text}`}
    >
      <Text
        className="font-hk700 text-[11px]"
        style={{ color: overdue ? palette.dangerText : palette.muted }}
        maxFontSizeMultiplier={1.3}
      >
        {overdue ? `Was ${text}` : text}
      </Text>
    </View>
  )
}
