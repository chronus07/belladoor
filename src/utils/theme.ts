export type VisualTheme = 'ROSE' | 'DARK_BARBER' | 'EMERALD' | 'MINIMAL';

export interface ThemeClasses {
  isDark: boolean;
  primaryBtn: string;
  primaryBtnSecondary: string;
  primaryText: string;
  primaryBgLight: string;
  primaryBorder: string;
  primaryBorderLight: string;
  accentBadge: string;
  accentBadgeDark: string;
  cardSelected: string;
  calendarSelected: string;
  calendarToday: string;
  calendarHover: string;
  slotSelected: string;
  coverBg: string;
  coverGradient: string;
  headerCardBg: string;
  headerCardBorder: string;
  headerTitleText: string;
  headerSubText: string;
  headerBioBg: string;
  headerBioText: string;
  headerBioBorder: string;
  contentBg: string;
  contentBorder: string;
  serviceCardBg: string;
  serviceCardBorder: string;
  serviceTitleText: string;
  servicePriceText: string;
  serviceDurationText: string;
  serviceRadioSelected: string;
  serviceRadioUnselected: string;
  summaryBoxBg: string;
  summaryBoxBorder: string;
  summaryTotalText: string;
  activeTabBorder: string;
  activeTabText: string;
  focusRing: string;
  avatarRing: string;
  modalHeaderBg: string;
}

export function getThemeClasses(
  theme?: VisualTheme,
  businessNiche?: 'BEAUTY' | 'BARBERSHOP' | 'NEUTRAL'
): ThemeClasses {
  const resolvedTheme: VisualTheme =
    businessNiche === 'BARBERSHOP' && (!theme || theme === 'ROSE')
      ? 'DARK_BARBER'
      : theme || 'ROSE';

  switch (resolvedTheme) {
    case 'DARK_BARBER':
      return {
        isDark: true,
        primaryBtn: 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20 active:scale-[0.99] transition cursor-pointer',
        primaryBtnSecondary: 'bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold border border-amber-500/30 transition cursor-pointer',
        primaryText: 'text-amber-400',
        primaryBgLight: 'bg-amber-500/10',
        primaryBorder: 'border-amber-500',
        primaryBorderLight: 'border-amber-500/30',
        accentBadge: 'bg-stone-900 border border-amber-500/40 text-amber-300',
        accentBadgeDark: 'bg-amber-500 text-stone-950 font-black',
        cardSelected: 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-xs',
        calendarSelected: 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/30 scale-105',
        calendarToday: 'border-2 border-amber-500 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 cursor-pointer',
        calendarHover: 'bg-stone-900 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:border-amber-500/50 hover:text-amber-400 cursor-pointer shadow-xs',
        slotSelected: 'bg-amber-500 text-stone-950 border-amber-500 font-black shadow-sm',
        coverBg: 'bg-stone-950',
        coverGradient: 'bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent',
        headerCardBg: 'bg-stone-900',
        headerCardBorder: 'border-amber-500/30 shadow-md',
        headerTitleText: 'text-stone-50',
        headerSubText: 'text-amber-400 font-bold',
        headerBioBg: 'bg-stone-950/80',
        headerBioText: 'text-stone-300',
        headerBioBorder: 'border-stone-800',
        contentBg: 'bg-stone-950/90',
        contentBorder: 'border-stone-800',
        serviceCardBg: 'bg-stone-900/90',
        serviceCardBorder: 'border-stone-800 hover:border-amber-500/40',
        serviceTitleText: 'text-stone-100',
        servicePriceText: 'text-amber-400 font-black',
        serviceDurationText: 'text-stone-400',
        serviceRadioSelected: 'bg-amber-500 border-amber-500 text-stone-950',
        serviceRadioUnselected: 'border-stone-700 bg-stone-800',
        summaryBoxBg: 'bg-stone-900/90',
        summaryBoxBorder: 'border-amber-500/30',
        summaryTotalText: 'text-amber-400 font-black',
        activeTabBorder: 'border-amber-500',
        activeTabText: 'text-amber-500 font-extrabold',
        focusRing: 'focus:ring-amber-500/30 focus:border-amber-500',
        avatarRing: 'border-amber-400/80 shadow-md',
        modalHeaderBg: 'bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white',
      };

    case 'EMERALD':
      return {
        isDark: false,
        primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/15 active:scale-[0.99] transition cursor-pointer',
        primaryBtnSecondary: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition cursor-pointer',
        primaryText: 'text-emerald-600',
        primaryBgLight: 'bg-emerald-50',
        primaryBorder: 'border-emerald-600',
        primaryBorderLight: 'border-emerald-200',
        accentBadge: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
        accentBadgeDark: 'bg-emerald-600 text-white font-bold',
        cardSelected: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs',
        calendarSelected: 'bg-emerald-600 text-white font-extrabold shadow-md scale-105',
        calendarToday: 'border-2 border-emerald-500 text-emerald-700 bg-emerald-50/40 hover:bg-emerald-100 cursor-pointer',
        calendarHover: 'bg-white border border-stone-200 text-stone-800 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 cursor-pointer shadow-xs',
        slotSelected: 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm',
        coverBg: 'bg-emerald-950',
        coverGradient: 'bg-gradient-to-t from-emerald-950/80 via-black/40 to-transparent',
        headerCardBg: 'bg-white',
        headerCardBorder: 'border-emerald-100 shadow-sm',
        headerTitleText: 'text-stone-900',
        headerSubText: 'text-emerald-700 font-bold',
        headerBioBg: 'bg-emerald-50/40',
        headerBioText: 'text-stone-700',
        headerBioBorder: 'border-emerald-100',
        contentBg: 'bg-stone-50/70',
        contentBorder: 'border-stone-200',
        serviceCardBg: 'bg-white',
        serviceCardBorder: 'border-stone-200 hover:border-emerald-300',
        serviceTitleText: 'text-stone-900',
        servicePriceText: 'text-emerald-900 font-extrabold',
        serviceDurationText: 'text-stone-500',
        serviceRadioSelected: 'bg-emerald-600 border-emerald-600 text-white',
        serviceRadioUnselected: 'border-stone-300 bg-white',
        summaryBoxBg: 'bg-emerald-50/70',
        summaryBoxBorder: 'border-emerald-200',
        summaryTotalText: 'text-emerald-950 font-extrabold',
        activeTabBorder: 'border-emerald-600',
        activeTabText: 'text-emerald-600 font-bold',
        focusRing: 'focus:ring-emerald-500/20 focus:border-emerald-500',
        avatarRing: 'border-white shadow-md',
        modalHeaderBg: 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 text-white',
      };

    case 'MINIMAL':
      return {
        isDark: false,
        primaryBtn: 'bg-stone-900 hover:bg-black text-white font-bold shadow-md active:scale-[0.99] transition cursor-pointer',
        primaryBtnSecondary: 'bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold border border-stone-200 transition cursor-pointer',
        primaryText: 'text-stone-900',
        primaryBgLight: 'bg-stone-100',
        primaryBorder: 'border-stone-900',
        primaryBorderLight: 'border-stone-200',
        accentBadge: 'bg-stone-100 border border-stone-300 text-stone-800',
        accentBadgeDark: 'bg-stone-900 text-white font-bold',
        cardSelected: 'bg-stone-100 border-stone-900 ring-2 ring-stone-900/20 shadow-xs',
        calendarSelected: 'bg-stone-900 text-white font-extrabold shadow-md scale-105',
        calendarToday: 'border-2 border-stone-750 text-stone-900 bg-stone-100/60 hover:bg-stone-200 cursor-pointer',
        calendarHover: 'bg-white border border-stone-200 text-stone-800 hover:bg-stone-100 hover:border-stone-400 hover:text-stone-900 cursor-pointer shadow-xs',
        slotSelected: 'bg-stone-900 text-white border-stone-900 font-bold shadow-sm',
        coverBg: 'bg-stone-950',
        coverGradient: 'bg-gradient-to-t from-stone-950/80 via-black/40 to-transparent',
        headerCardBg: 'bg-white',
        headerCardBorder: 'border-stone-200 shadow-sm',
        headerTitleText: 'text-stone-900',
        headerSubText: 'text-stone-800 font-bold',
        headerBioBg: 'bg-stone-50',
        headerBioText: 'text-stone-700',
        headerBioBorder: 'border-stone-200',
        contentBg: 'bg-stone-50/70',
        contentBorder: 'border-stone-200',
        serviceCardBg: 'bg-white',
        serviceCardBorder: 'border-stone-200 hover:border-stone-400',
        serviceTitleText: 'text-stone-900',
        servicePriceText: 'text-stone-950 font-extrabold',
        serviceDurationText: 'text-stone-500',
        serviceRadioSelected: 'bg-stone-900 border-stone-900 text-white',
        serviceRadioUnselected: 'border-stone-300 bg-white',
        summaryBoxBg: 'bg-stone-100/80',
        summaryBoxBorder: 'border-stone-200',
        summaryTotalText: 'text-stone-950 font-extrabold',
        activeTabBorder: 'border-stone-900',
        activeTabText: 'text-stone-900 font-bold',
        focusRing: 'focus:ring-stone-500/20 focus:border-stone-900',
        avatarRing: 'border-white shadow-md',
        modalHeaderBg: 'bg-gradient-to-br from-stone-900 via-stone-800 to-black text-white',
      };

    case 'ROSE':
    default:
      return {
        isDark: false,
        primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/15 active:scale-[0.99] transition cursor-pointer',
        primaryBtnSecondary: 'bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition cursor-pointer',
        primaryText: 'text-rose-600',
        primaryBgLight: 'bg-rose-50',
        primaryBorder: 'border-rose-600',
        primaryBorderLight: 'border-rose-200',
        accentBadge: 'bg-rose-50 border border-rose-200 text-rose-800',
        accentBadgeDark: 'bg-rose-600 text-white font-bold',
        cardSelected: 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs',
        calendarSelected: 'bg-rose-600 text-white font-extrabold shadow-md scale-105',
        calendarToday: 'border-2 border-rose-400 text-rose-700 bg-rose-50/30 hover:bg-rose-100 cursor-pointer',
        calendarHover: 'bg-white border border-stone-200 text-stone-800 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-700 cursor-pointer shadow-xs',
        slotSelected: 'bg-rose-600 text-white border-rose-600 font-bold shadow-sm',
        coverBg: 'bg-rose-900',
        coverGradient: 'bg-gradient-to-t from-black/60 to-transparent',
        headerCardBg: 'bg-white',
        headerCardBorder: 'border-stone-200 shadow-sm',
        headerTitleText: 'text-stone-900',
        headerSubText: 'text-rose-600 font-semibold',
        headerBioBg: 'bg-stone-50',
        headerBioText: 'text-stone-600',
        headerBioBorder: 'border-stone-100',
        contentBg: 'bg-stone-50/70',
        contentBorder: 'border-stone-200',
        serviceCardBg: 'bg-white',
        serviceCardBorder: 'border-stone-200 hover:border-rose-300',
        serviceTitleText: 'text-stone-900',
        servicePriceText: 'text-stone-900 font-extrabold',
        serviceDurationText: 'text-stone-500',
        serviceRadioSelected: 'bg-rose-600 border-rose-600 text-white',
        serviceRadioUnselected: 'border-stone-300 bg-white',
        summaryBoxBg: 'bg-rose-50/70',
        summaryBoxBorder: 'border-rose-100',
        summaryTotalText: 'text-rose-950 font-extrabold',
        activeTabBorder: 'border-rose-600',
        activeTabText: 'text-rose-600 font-bold',
        focusRing: 'focus:ring-rose-500/20 focus:border-rose-500',
        avatarRing: 'border-white shadow-md',
        modalHeaderBg: 'bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 text-white',
      };
  }
}
