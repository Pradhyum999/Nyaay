import React from 'react';
import { CalendarDays, Briefcase, Inbox, IndianRupee, Menu, Scale, Sparkles, MessageSquare, User } from 'lucide-react';

export type TabDef = {
  id: string;
  to: string;
  labelKey: string;
  labelEn: string;
  labelHi: string;
  labelMr: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: 'unread' | 'attention';
};

export const lawyerTabs: TabDef[] = [
  { id: 'today', to: '/today', labelKey: 'nav.today', labelEn: 'Today', labelHi: 'आज', labelMr: 'आज', icon: CalendarDays },
  { id: 'cases', to: '/cases', labelKey: 'nav.cases', labelEn: 'Cases', labelHi: 'मामले', labelMr: 'केस फाइल्स', icon: Briefcase },
  { id: 'inbox', to: '/inbox', labelKey: 'nav.inbox', labelEn: 'Inbox', labelHi: 'संदेश', labelMr: 'संदेश', icon: Inbox, badge: 'unread' },
  { id: 'fees',  to: '/fees',  labelKey: 'nav.fees',  labelEn: 'Fees',  labelHi: 'शुल्क',  labelMr: 'फी',  icon: IndianRupee },
  { id: 'more',  to: '/more',  labelKey: 'nav.more',  labelEn: 'More',  labelHi: 'अधिक',  labelMr: 'अधिक', icon: Menu },
];

export const clientTabs: TabDef[] = [
  { id: 'case',     to: '/case',     labelKey: 'nav.case',     labelEn: 'Case',      labelHi: 'केस रूम',  labelMr: 'केस रूम',  icon: Scale },
  { id: 'help',     to: '/help',     labelKey: 'nav.findHelp', labelEn: 'Find Help', labelHi: 'सहायता',   labelMr: 'मदत',     icon: Sparkles },
  { id: 'messages', to: '/messages', labelKey: 'nav.messages', labelEn: 'Messages',  labelHi: 'चैट',      labelMr: 'चॅट',      icon: MessageSquare, badge: 'unread' },
  { id: 'me',       to: '/me',       labelKey: 'nav.me',       labelEn: 'Me',        labelHi: 'प्रोफाइल', labelMr: 'माझे खाते', icon: User },
];
