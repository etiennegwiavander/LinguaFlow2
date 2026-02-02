import { NavItem } from "@/types";

export const languages = [
  // Current 12 languages
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  
  // Tier 1: High Priority (6 languages)
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'pt-BR', name: 'Brazilian Portuguese', flag: '🇧🇷' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  
  // Tier 2: Premium Markets (6 languages)
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  
  // Tier 3: Emerging Markets (7 languages)
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
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
    title: 'Manage Subscription',
    href: '/subscription/manage',
    icon: 'CreditCard'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings2'
  },
];