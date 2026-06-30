/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Theme {
  id: string;
  name: string;
  levelRequired: number;
  description: string;
  emoji: string;
  colors: {
    primary: string;     // Overrides green #4F8A5B
    accent: string;      // Overrides lime #A7C957
    text: string;        // Overrides dark text #2F3E2E
    bg: string;          // Overrides backdrop #F6F8F2
    lightBg: string;     // Overrides soft green tints #EAF2EC
    hover: string;       // Overrides primary hover #3E6B48
    cardBg: string;      // Card backdrop, standard white
    shadowColor: string; // Dynamic shadow cast color
  };
}

export const THEMES: Theme[] = [
  {
    id: 'forest',
    name: 'Tranquil Forest',
    levelRequired: 1,
    description: 'The classic, serene green aesthetic that keeps you fully focused.',
    emoji: '🌿',
    colors: {
      primary: '#4F8A5B',
      accent: '#A7C957',
      text: '#2F3E2E',
      bg: '#F6F8F2',
      lightBg: '#EAF2EC',
      hover: '#3E6B48',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(79, 138, 91, 0.1)'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Theme',
    levelRequired: 2,
    description: 'A fresh, calming look inspired by the infinite quiet of the sea.',
    emoji: '🌊',
    colors: {
      primary: '#2A6F97',
      accent: '#4CC9F0',
      text: '#012A4A',
      bg: '#EDF6F9',
      lightBg: '#E2EAF4',
      hover: '#014F86',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(42, 111, 151, 0.1)'
    }
  },
  {
    id: 'sakura',
    name: 'Sakura Theme',
    levelRequired: 3,
    description: 'A delicate, peaceful rose theme celebrating fresh beginnings.',
    emoji: '🌸',
    colors: {
      primary: '#D53F8C',
      accent: '#FBB6CE',
      text: '#500724',
      bg: '#FFF5F5',
      lightBg: '#FFE3EC',
      hover: '#B83280',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(213, 63, 140, 0.1)'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Theme',
    levelRequired: 4,
    description: 'A warm, grounding golden gradient echoing tranquil evening skies.',
    emoji: '🌅',
    colors: {
      primary: '#DD6B20',
      accent: '#ECC94B',
      text: '#431407',
      bg: '#FFFDF5',
      lightBg: '#FFEDD5',
      hover: '#C05621',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(221, 107, 32, 0.1)'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight Theme',
    levelRequired: 5,
    description: 'A deep, quiet midnight space styled for serene night focus.',
    emoji: '🌙',
    colors: {
      primary: '#312E81',
      accent: '#818CF8',
      text: '#1E1B4B',
      bg: '#F8FAFC',
      lightBg: '#EEF2FF',
      hover: '#1E1B4B',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(49, 46, 129, 0.1)'
    }
  },
  {
    id: 'autumn',
    name: 'Autumn Theme',
    levelRequired: 6,
    description: 'A cozy, rich copper and amber slate for warm, focused productivity.',
    emoji: '🍂',
    colors: {
      primary: '#9A3412',
      accent: '#F59E0B',
      text: '#451A03',
      bg: '#FAF7F2',
      lightBg: '#FFEDD5',
      hover: '#7C2D12',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(154, 52, 18, 0.1)'
    }
  },
  {
    id: 'winter',
    name: 'Winter Theme',
    levelRequired: 7,
    description: 'A pristine, quiet frost blue theme celebrating winter clarity.',
    emoji: '❄️',
    colors: {
      primary: '#1D4ED8',
      accent: '#60A5FA',
      text: '#1E293B',
      bg: '#F1F5F9',
      lightBg: '#DBEAFE',
      hover: '#1E40AF',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(29, 78, 216, 0.1)'
    }
  },
  {
    id: 'aurora',
    name: 'Aurora Theme',
    levelRequired: 8,
    description: 'A vivid, magical northern lights emerald workspace for high-vibe ideas.',
    emoji: '✨',
    colors: {
      primary: '#047857',
      accent: '#34D399',
      text: '#064E3B',
      bg: '#ECFDF5',
      lightBg: '#D1FAE5',
      hover: '#065F46',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(4, 120, 87, 0.1)'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal Theme',
    levelRequired: 9,
    description: 'A stripped-back, high-contrast clean grey layout for clutter-free minds.',
    emoji: '☁️',
    colors: {
      primary: '#18181B',
      accent: '#71717A',
      text: '#09090B',
      bg: '#FAFAFA',
      lightBg: '#F4F4F5',
      hover: '#27272A',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(24, 24, 27, 0.05)'
    }
  },
  {
    id: 'exclusive',
    name: 'Exclusive Premium Theme',
    levelRequired: 10,
    description: 'An elegant imperial brass and gold workspace reserved for focus masters.',
    emoji: '🏆',
    colors: {
      primary: '#854D0E',
      accent: '#EAB308',
      text: '#422006',
      bg: '#FDFBF7',
      lightBg: '#FEF9E7',
      hover: '#713F12',
      cardBg: '#FFFFFF',
      shadowColor: 'rgba(133, 77, 14, 0.1)'
    }
  }
];

export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function generateThemeCSS(theme: Theme): string {
  const c = theme.colors;
  return `
    /* DYNAMIC APPEARANCE CUSTOMIZATION: ${theme.name} */
    :root {
      --color-primary-gold: ${c.primary} !important;
      --color-primary-soft: ${c.accent} !important;
    }
    
    /* Overrides for #4F8A5B (Primary Green) */
    .bg-\\[\\#4F8A5B\\] { background-color: ${c.primary} !important; }
    .text-\\[\\#4F8A5B\\] { color: ${c.primary} !important; }
    .border-\\[\\#4F8A5B\\] { border-color: ${c.primary} !important; }
    .border-\\[\\#4F8A5B\\]\\/5 { border-color: ${c.primary}0D !important; }
    .border-\\[\\#4F8A5B\\]\\/10 { border-color: ${c.primary}1A !important; }
    .border-\\[\\#4F8A5B\\]\\/15 { border-color: ${c.primary}26 !important; }
    .border-\\[\\#4F8A5B\\]\\/20 { border-color: ${c.primary}33 !important; }
    .bg-\\[\\#4F8A5B\\]\\/5 { background-color: ${c.primary}0D !important; }
    .bg-\\[\\#4F8A5B\\]\\/10 { background-color: ${c.primary}1A !important; }
    .bg-\\[\\#4F8A5B\\]\\/15 { background-color: ${c.primary}26 !important; }
    .bg-\\[\\#4F8A5B\\]\\/25 { background-color: ${c.primary}40 !important; }
    
    .from-\\[\\#4F8A5B\\] { 
      --tw-gradient-from: ${c.primary} !important; 
      --tw-gradient-to: ${c.primary}00 !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    .to-\\[\\#4F8A5B\\] { 
      --tw-gradient-to: ${c.primary} !important; 
    }
    
    /* Overrides for #2F3E2E (Deep Charcoal/Forest Text) */
    .text-\\[\\#2F3E2E\\] { color: ${c.text} !important; }
    .bg-\\[\\#2F3E2E\\] { background-color: ${c.text} !important; }
    .border-\\[\\#2F3E2E\\] { border-color: ${c.text} !important; }
    .hover\\:text-\\[\\#2F3E2E\\]:hover { color: ${c.text} !important; }
    
    /* Overrides for #A7C957 (Lime Accent) */
    .bg-\\[\\#A7C957\\] { background-color: ${c.accent} !important; }
    .text-\\[\\#A7C957\\] { color: ${c.accent} !important; }
    .border-\\[\\#A7C957\\] { border-color: ${c.accent} !important; }
    
    /* Overrides for #F6F8F2 (Soft Sage Background) */
    body { background-color: ${c.bg} !important; color: ${c.text} !important; }
    .bg-forest-bg { background-color: ${c.bg} !important; }
    .bg-\\[\\#F6F8F2\\] { background-color: ${c.bg} !important; }
    .bg-\\[\\#F6F8F2\\]\\/30 { background-color: ${c.bg}4D !important; }
    .bg-\\[\\#F6F8F2\\]\\/45 { background-color: ${c.bg}73 !important; }
    .bg-\\[\\#F6F8F2\\]\\/50 { background-color: ${c.bg}80 !important; }
    .bg-\\[\\#F6F8F2\\]\\/60 { background-color: ${c.bg}99 !important; }
    .border-\\[\\#F6F8F2\\] { border-color: ${c.bg} !important; }
    
    /* Overrides for #EAF2EC (Active Navigation Soft Tint) */
    .bg-\\[\\#EAF2EC\\] { background-color: ${c.lightBg} !important; }
    .border-\\[\\#EAF2EC\\] { border-color: ${c.lightBg} !important; }
    .hover\\:bg-\\[\\#EAF2EC\\]:hover { background-color: ${c.lightBg} !important; }
    
    /* Overrides for hover states */
    .hover\\:bg-\\[\\#3E6B48\\]:hover { background-color: ${c.hover} !important; }
    .hover\\:text-\\[\\#3E6B48\\]:hover { color: ${c.hover} !important; }
    .to-\\[\\#3E6B48\\] { --tw-gradient-to: ${c.hover} !important; }
    .from-\\[\\#3E6B48\\] { 
      --tw-gradient-from: ${c.hover} !important; 
      --tw-gradient-to: ${c.hover}00 !important;
      --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
    }
    
    /* Overrides for other secondary styles */
    .text-emerald-700 { color: ${c.primary} !important; }
    .bg-emerald-50 { background-color: ${c.lightBg} !important; }
    .border-emerald-200 { border-color: ${c.accent}80 !important; }
    
    /* Custom style variables for scrollbar and glow */
    ::-webkit-scrollbar-track {
      background: ${c.primary}08 !important;
    }
    ::-webkit-scrollbar-thumb {
      background: ${c.primary}33 !important;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${c.primary}66 !important;
    }
    
    /* Sparkle fill overrides for theme consistency */
    .golden-sparkle-path {
      fill: ${c.accent} !important;
      stroke: ${c.primary} !important;
    }
    .text-amber-500 { color: ${c.accent} !important; }
    .text-yellow-500 { color: ${c.accent} !important; }
    .text-amber-600 { color: ${c.primary} !important; }
    .bg-amber-100 { background-color: ${c.lightBg} !important; }
    .bg-amber-50 { background-color: ${c.bg} !important; }
    
    /* Smooth theme transition */
    * {
      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }
  `;
}
