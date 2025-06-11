import { NavItem } from "@/types";

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
];

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'GaugeCircle'
  },
  {
    title: 'My Students',
    href: '/students',
    icon: 'GraduationCap'
  },
  {
    title: 'Calendar Sync',
    href: '/calendar',
    icon: 'CalendarClock'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings2'
  },
  {
    title: 'Admin Panel',
    href: '/admin',
    icon: 'ShieldCheck',
    requiresAdmin: true
  }
];