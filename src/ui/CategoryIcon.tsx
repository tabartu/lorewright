import {
  Bookmark,
  CalendarDays,
  Gem,
  MapPin,
  PawPrint,
  Shield,
  Sparkles,
  UserRound,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

const ICONS: Record<string, ComponentType<LucideProps>> = {
  'user-round': UserRound,
  'map-pin': MapPin,
  shield: Shield,
  'calendar-days': CalendarDays,
  gem: Gem,
  'paw-print': PawPrint,
  sparkles: Sparkles,
  bookmark: Bookmark,
}

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Bookmark
  return <Icon aria-hidden="true" strokeWidth={1.75} {...props} />
}
