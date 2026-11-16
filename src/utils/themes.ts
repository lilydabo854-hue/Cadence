import type {
  BackgroundPatternId,
  BrandingConfig,
  SurfaceTranslucency,
  ThemeMode,
  ThemePresetId,
} from '../types/workspace';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  label: string;
  vibe: string;
  accentHex: string;
  secondaryHex: string;
  previewSwatches: [string, string, string];
  light: {
    baseColor: string;
    gradient: string;
    surfaceRgb: string;
    strongRgb: string;
    softRgb: string;
    inputRgb: string;
    border: string;
    divider: string;
  };
  dark: {
    baseColor: string;
    gradient: string;
    surfaceRgb: string;
    strongRgb: string;
    softRgb: string;
    inputRgb: string;
    border: string;
    divider: string;
  };
}

export interface BackgroundPatternDefinition {
  id: BackgroundPatternId;
  label: string;
  description: string;
  size: string;
  getLightImage: (accentHex: string) => string;
  getDarkImage: (accentHex: string) => string;
}

export interface TranslucencyDefinition {
  id: SurfaceTranslucency;
  label: string;
  description: string;
  cardAlphaLight: number;
  strongAlphaLight: number;
  softAlphaLight: number;
  inputAlphaLight: number;
  cardAlphaDark: number;
  strongAlphaDark: number;
  softAlphaDark: number;
  inputAlphaDark: number;
  blurPx: number;
}

export const DEFAULT_THEME_PRESET: ThemePresetId = 'aurora';
export const DEFAULT_BG_PATTERN: BackgroundPatternId = 'terrazzo';
export const DEFAULT_TRANSLUCENCY: SurfaceTranslucency = 'frosted';

export const THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: 'aurora',
    label: 'Aurora Citrus',
    vibe: 'Mint, sunlit peach & sky glow',
    accentHex: '#0F766E',
    secondaryHex: '#0284C7',
    previewSwatches: ['#6EE7B7', '#FDE68A', '#7DD3FC'],
    light: {
      baseColor: '#ECFEFF',
      gradient:
        'radial-gradient(at 8% 10%, rgba(110, 231, 183, 0.62) 0px, transparent 52%), radial-gradient(at 88% 12%, rgba(125, 211, 252, 0.58) 0px, transparent 50%), radial-gradient(at 78% 85%, rgba(253, 230, 138, 0.58) 0px, transparent 54%), radial-gradient(at 18% 82%, rgba(251, 207, 232, 0.45) 0px, transparent 52%), linear-gradient(135deg, #ECFEFF 0%, #F0FDF4 50%, #FFFBEB 100%)',
      surfaceRgb: '247, 254, 252',
      strongRgb: '250, 255, 254',
      softRgb: '232, 250, 246',
      inputRgb: '255, 255, 255',
      border: 'rgba(15, 118, 110, 0.14)',
      divider: 'rgba(15, 118, 110, 0.10)',
    },
    dark: {
      baseColor: '#071419',
      gradient:
        'radial-gradient(at 10% 12%, rgba(16, 185, 129, 0.28) 0px, transparent 52%), radial-gradient(at 88% 14%, rgba(14, 165, 233, 0.26) 0px, transparent 52%), radial-gradient(at 75% 88%, rgba(245, 158, 11, 0.18) 0px, transparent 50%), radial-gradient(at 15% 85%, rgba(217, 70, 239, 0.16) 0px, transparent 50%), linear-gradient(135deg, #071419 0%, #0B192C 55%, #111629 100%)',
      surfaceRgb: '11, 26, 36',
      strongRgb: '9, 21, 31',
      softRgb: '17, 39, 52',
      inputRgb: '8, 18, 28',
      border: 'rgba(153, 246, 228, 0.14)',
      divider: 'rgba(153, 246, 228, 0.10)',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Sorbet',
    vibe: 'Coral rose, apricot & golden hour',
    accentHex: '#E11D48',
    secondaryHex: '#EA580C',
    previewSwatches: ['#FDBA74', '#FDA4AF', '#FDE047'],
    light: {
      baseColor: '#FFF7ED',
      gradient:
        'radial-gradient(at 12% 14%, rgba(253, 186, 116, 0.65) 0px, transparent 54%), radial-gradient(at 88% 18%, rgba(253, 164, 175, 0.60) 0px, transparent 52%), radial-gradient(at 82% 84%, rgba(254, 240, 138, 0.62) 0px, transparent 52%), radial-gradient(at 16% 85%, rgba(221, 214, 254, 0.50) 0px, transparent 54%), linear-gradient(135deg, #FFF7ED 0%, #FFF1F2 55%, #FEFCE8 100%)',
      surfaceRgb: '255, 249, 246',
      strongRgb: '255, 251, 248',
      softRgb: '255, 238, 231',
      inputRgb: '255, 255, 255',
      border: 'rgba(225, 29, 72, 0.14)',
      divider: 'rgba(225, 29, 72, 0.10)',
    },
    dark: {
      baseColor: '#190B14',
      gradient:
        'radial-gradient(at 12% 14%, rgba(249, 115, 22, 0.28) 0px, transparent 52%), radial-gradient(at 86% 18%, rgba(244, 63, 94, 0.28) 0px, transparent 52%), radial-gradient(at 78% 86%, rgba(234, 179, 8, 0.16) 0px, transparent 50%), radial-gradient(at 16% 84%, rgba(168, 85, 247, 0.20) 0px, transparent 50%), linear-gradient(135deg, #1A0A14 0%, #240F1C 55%, #171024 100%)',
      surfaceRgb: '34, 16, 28',
      strongRgb: '28, 12, 23',
      softRgb: '49, 23, 39',
      inputRgb: '22, 10, 19',
      border: 'rgba(253, 164, 175, 0.15)',
      divider: 'rgba(253, 164, 175, 0.10)',
    },
  },
  {
    id: 'berry',
    label: 'Berry Fizz',
    vibe: 'Raspberry pop, lilac & cloud sky',
    accentHex: '#A21CAF',
    secondaryHex: '#4F46E5',
    previewSwatches: ['#F9A8D4', '#C4B5FD', '#93C5FD'],
    light: {
      baseColor: '#FDF4FF',
      gradient:
        'radial-gradient(at 10% 10%, rgba(249, 168, 212, 0.62) 0px, transparent 52%), radial-gradient(at 88% 14%, rgba(196, 181, 253, 0.65) 0px, transparent 52%), radial-gradient(at 82% 84%, rgba(147, 197, 253, 0.58) 0px, transparent 52%), radial-gradient(at 18% 82%, rgba(254, 243, 199, 0.56) 0px, transparent 52%), linear-gradient(135deg, #FDF4FF 0%, #F5F3FF 52%, #EFF6FF 100%)',
      surfaceRgb: '253, 247, 255',
      strongRgb: '254, 250, 255',
      softRgb: '246, 234, 253',
      inputRgb: '255, 255, 255',
      border: 'rgba(162, 28, 175, 0.14)',
      divider: 'rgba(162, 28, 175, 0.10)',
    },
    dark: {
      baseColor: '#130921',
      gradient:
        'radial-gradient(at 12% 12%, rgba(217, 70, 239, 0.28) 0px, transparent 52%), radial-gradient(at 86% 18%, rgba(99, 102, 241, 0.30) 0px, transparent 52%), radial-gradient(at 78% 86%, rgba(56, 189, 248, 0.18) 0px, transparent 50%), radial-gradient(at 15% 84%, rgba(244, 114, 182, 0.20) 0px, transparent 50%), linear-gradient(135deg, #140922 0%, #1B1033 55%, #0F172A 100%)',
      surfaceRgb: '27, 15, 44',
      strongRgb: '21, 11, 35',
      softRgb: '40, 23, 62',
      inputRgb: '17, 10, 30',
      border: 'rgba(232, 121, 249, 0.16)',
      divider: 'rgba(232, 121, 249, 0.10)',
    },
  },
  {
    id: 'lagoon',
    label: 'Tropical Lagoon',
    vibe: 'Breezy aqua, periwinkle & lemon sun',
    accentHex: '#0369A1',
    secondaryHex: '#0D9488',
    previewSwatches: ['#67E8F9', '#6EE7B7', '#A5B4FC'],
    light: {
      baseColor: '#F0FDFA',
      gradient:
        'radial-gradient(at 12% 14%, rgba(103, 232, 249, 0.62) 0px, transparent 52%), radial-gradient(at 88% 12%, rgba(165, 180, 252, 0.56) 0px, transparent 52%), radial-gradient(at 78% 86%, rgba(110, 231, 183, 0.56) 0px, transparent 52%), radial-gradient(at 16% 84%, rgba(254, 249, 195, 0.58) 0px, transparent 52%), linear-gradient(135deg, #ECFEFF 0%, #F0FDFA 50%, #EEF2FF 100%)',
      surfaceRgb: '244, 252, 254',
      strongRgb: '248, 253, 255',
      softRgb: '226, 247, 251',
      inputRgb: '255, 255, 255',
      border: 'rgba(3, 105, 161, 0.14)',
      divider: 'rgba(3, 105, 161, 0.10)',
    },
    dark: {
      baseColor: '#061521',
      gradient:
        'radial-gradient(at 12% 12%, rgba(6, 182, 212, 0.28) 0px, transparent 52%), radial-gradient(at 88% 16%, rgba(99, 102, 241, 0.26) 0px, transparent 52%), radial-gradient(at 78% 86%, rgba(20, 184, 166, 0.24) 0px, transparent 50%), linear-gradient(135deg, #061420 0%, #0A2233 55%, #0F172A 100%)',
      surfaceRgb: '10, 28, 42',
      strongRgb: '8, 22, 34',
      softRgb: '15, 42, 60',
      inputRgb: '7, 19, 30',
      border: 'rgba(103, 232, 249, 0.15)',
      divider: 'rgba(103, 232, 249, 0.10)',
    },
  },
  {
    id: 'matcha',
    label: 'Matcha Cream',
    vibe: 'Pistachio, sage leaf & oat vanilla',
    accentHex: '#15803D',
    secondaryHex: '#0F766E',
    previewSwatches: ['#BEF264', '#86EFAC', '#FDE68A'],
    light: {
      baseColor: '#F7FEE7',
      gradient:
        'radial-gradient(at 10% 12%, rgba(190, 242, 100, 0.52) 0px, transparent 52%), radial-gradient(at 88% 14%, rgba(134, 239, 172, 0.56) 0px, transparent 52%), radial-gradient(at 80% 85%, rgba(253, 230, 138, 0.55) 0px, transparent 52%), radial-gradient(at 18% 82%, rgba(186, 230, 253, 0.45) 0px, transparent 52%), linear-gradient(135deg, #F7FEE7 0%, #F0FDF4 52%, #FFFBEB 100%)',
      surfaceRgb: '250, 254, 245',
      strongRgb: '252, 255, 249',
      softRgb: '238, 250, 226',
      inputRgb: '255, 255, 255',
      border: 'rgba(21, 128, 61, 0.14)',
      divider: 'rgba(21, 128, 61, 0.10)',
    },
    dark: {
      baseColor: '#0A170F',
      gradient:
        'radial-gradient(at 12% 12%, rgba(132, 204, 22, 0.22) 0px, transparent 52%), radial-gradient(at 88% 16%, rgba(16, 185, 129, 0.24) 0px, transparent 52%), radial-gradient(at 78% 86%, rgba(234, 179, 8, 0.16) 0px, transparent 50%), linear-gradient(135deg, #09160E 0%, #0E2318 55%, #0D1B1E 100%)',
      surfaceRgb: '14, 30, 20',
      strongRgb: '10, 24, 16',
      softRgb: '21, 44, 30',
      inputRgb: '9, 20, 13',
      border: 'rgba(134, 239, 172, 0.14)',
      divider: 'rgba(134, 239, 172, 0.10)',
    },
  },
  {
    id: 'prism',
    label: 'Prism Pop',
    vibe: 'Playful 4-corner pastel rainbow',
    accentHex: '#4338CA',
    secondaryHex: '#BE185D',
    previewSwatches: ['#93C5FD', '#F9A8D4', '#FDBA74'],
    light: {
      baseColor: '#F8FAFC',
      gradient:
        'radial-gradient(at 8% 10%, rgba(147, 197, 253, 0.62) 0px, transparent 50%), radial-gradient(at 92% 12%, rgba(249, 168, 212, 0.62) 0px, transparent 50%), radial-gradient(at 88% 88%, rgba(253, 186, 116, 0.58) 0px, transparent 50%), radial-gradient(at 12% 88%, rgba(110, 231, 183, 0.54) 0px, transparent 50%), linear-gradient(135deg, #EFF6FF 0%, #FDF2F8 50%, #FFFBEB 100%)',
      surfaceRgb: '250, 250, 255',
      strongRgb: '253, 253, 255',
      softRgb: '238, 241, 253',
      inputRgb: '255, 255, 255',
      border: 'rgba(67, 56, 202, 0.14)',
      divider: 'rgba(67, 56, 202, 0.10)',
    },
    dark: {
      baseColor: '#0A0D1D',
      gradient:
        'radial-gradient(at 10% 10%, rgba(59, 130, 246, 0.28) 0px, transparent 52%), radial-gradient(at 90% 14%, rgba(236, 72, 153, 0.25) 0px, transparent 52%), radial-gradient(at 84% 88%, rgba(249, 115, 22, 0.18) 0px, transparent 50%), radial-gradient(at 14% 86%, rgba(16, 185, 129, 0.20) 0px, transparent 50%), linear-gradient(135deg, #090D1C 0%, #151430 55%, #161124 100%)',
      surfaceRgb: '16, 20, 40',
      strongRgb: '12, 16, 33',
      softRgb: '25, 31, 58',
      inputRgb: '10, 14, 28',
      border: 'rgba(165, 180, 252, 0.15)',
      divider: 'rgba(165, 180, 252, 0.10)',
    },
  },
];

function svgUrl(svgBody: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svgBody)}")`;
}

export const BACKGROUND_PATTERNS: BackgroundPatternDefinition[] = [
  {
    id: 'terrazzo',
    label: 'Confetti Terrazzo',
    description: 'Playful geometric specks & confetti shapes',
    size: '64px 64px',
    getLightImage: (accentHex) =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">` +
          `<circle cx="12" cy="14" r="2.2" fill="${accentHex}" fill-opacity="0.18"/>` +
          `<polygon points="44,8 50,15 41,17" fill="#ffffff" fill-opacity="0.55"/>` +
          `<rect x="24" y="34" width="6" height="3" rx="1.5" transform="rotate(-25 27 35.5)" fill="${accentHex}" fill-opacity="0.16"/>` +
          `<circle cx="52" cy="48" r="2.6" fill="#ffffff" fill-opacity="0.5"/>` +
          `<polygon points="10,48 16,52 11,56" fill="${accentHex}" fill-opacity="0.14"/>` +
          `<circle cx="34" cy="18" r="1.6" fill="#0f172a" fill-opacity="0.08"/>` +
          `</svg>`
      ),
    getDarkImage: (accentHex) =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">` +
          `<circle cx="12" cy="14" r="2.2" fill="#ffffff" fill-opacity="0.16"/>` +
          `<polygon points="44,8 50,15 41,17" fill="${accentHex}" fill-opacity="0.28"/>` +
          `<rect x="24" y="34" width="6" height="3" rx="1.5" transform="rotate(-25 27 35.5)" fill="#ffffff" fill-opacity="0.14"/>` +
          `<circle cx="52" cy="48" r="2.4" fill="#ffffff" fill-opacity="0.13"/>` +
          `<polygon points="10,48 16,52 11,56" fill="${accentHex}" fill-opacity="0.24"/>` +
          `</svg>`
      ),
  },
  {
    id: 'dots',
    label: 'Polka Dots',
    description: 'Crisp staggered dot matrix',
    size: '28px 28px',
    getLightImage: (accentHex) =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">` +
          `<circle cx="7" cy="7" r="1.75" fill="${accentHex}" fill-opacity="0.16"/>` +
          `<circle cx="21" cy="21" r="1.75" fill="#ffffff" fill-opacity="0.55"/>` +
          `</svg>`
      ),
    getDarkImage: () =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">` +
          `<circle cx="7" cy="7" r="1.5" fill="#ffffff" fill-opacity="0.14"/>` +
          `<circle cx="21" cy="21" r="1.5" fill="#ffffff" fill-opacity="0.09"/>` +
          `</svg>`
      ),
  },
  {
    id: 'waves',
    label: 'Wavy Ribbons',
    description: 'Smooth repeating ocean waves',
    size: '64px 32px',
    getLightImage: (accentHex) =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32" fill="none">` +
          `<path d="M0 16 Q 16 6 32 16 T 64 16" stroke="#ffffff" stroke-opacity="0.52" stroke-width="1.6"/>` +
          `<path d="M0 28 Q 16 18 32 28 T 64 28" stroke="${accentHex}" stroke-opacity="0.13" stroke-width="1.2"/>` +
          `</svg>`
      ),
    getDarkImage: () =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32" fill="none">` +
          `<path d="M0 16 Q 16 6 32 16 T 64 16" stroke="#ffffff" stroke-opacity="0.11" stroke-width="1.4"/>` +
          `<path d="M0 28 Q 16 18 32 28 T 64 28" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.1"/>` +
          `</svg>`
      ),
  },
  {
    id: 'grid',
    label: 'Studio Graph',
    description: 'Clean architectural grid with subtle ticks',
    size: '36px 36px',
    getLightImage: (accentHex) =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">` +
          `<path d="M 36 0 L 0 0 0 36" stroke="#ffffff" stroke-opacity="0.48" stroke-width="1"/>` +
          `<circle cx="0" cy="0" r="1.4" fill="${accentHex}" fill-opacity="0.18"/>` +
          `</svg>`
      ),
    getDarkImage: () =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">` +
          `<path d="M 36 0 L 0 0 0 36" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>` +
          `<circle cx="0" cy="0" r="1.2" fill="#ffffff" fill-opacity="0.14"/>` +
          `</svg>`
      ),
  },
  {
    id: 'checks',
    label: 'Gingham Checks',
    description: 'Soft translucent woven pastel checks',
    size: '48px 48px',
    getLightImage: () =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">` +
          `<rect x="0" y="0" width="24" height="24" fill="#ffffff" fill-opacity="0.22"/>` +
          `<rect x="24" y="24" width="24" height="24" fill="#ffffff" fill-opacity="0.22"/>` +
          `</svg>`
      ),
    getDarkImage: () =>
      svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">` +
          `<rect x="0" y="0" width="24" height="24" fill="#ffffff" fill-opacity="0.04"/>` +
          `<rect x="24" y="24" width="24" height="24" fill="#ffffff" fill-opacity="0.04"/>` +
          `</svg>`
      ),
  },
  {
    id: 'none',
    label: 'Smooth Gradient',
    description: 'Pure multi-stop gradient without pattern',
    size: 'auto',
    getLightImage: () => 'linear-gradient(transparent, transparent)',
    getDarkImage: () => 'linear-gradient(transparent, transparent)',
  },
];

export const TRANSLUCENCY_LEVELS: TranslucencyDefinition[] = [
  {
    id: 'sheer',
    label: 'Sheer Glass',
    description: 'Maximum gradient & pattern bleed-through',
    cardAlphaLight: 0.62,
    strongAlphaLight: 0.74,
    softAlphaLight: 0.42,
    inputAlphaLight: 0.78,
    cardAlphaDark: 0.58,
    strongAlphaDark: 0.72,
    softAlphaDark: 0.40,
    inputAlphaDark: 0.74,
    blurPx: 18,
  },
  {
    id: 'frosted',
    label: 'Frosted Glow',
    description: 'Balanced translucent glass & crisp readability',
    cardAlphaLight: 0.76,
    strongAlphaLight: 0.85,
    softAlphaLight: 0.54,
    inputAlphaLight: 0.86,
    cardAlphaDark: 0.72,
    strongAlphaDark: 0.82,
    softAlphaDark: 0.50,
    inputAlphaDark: 0.82,
    blurPx: 16,
  },
  {
    id: 'crisp',
    label: 'Crisp Tint',
    description: 'Higher opacity tinted surface with soft edge',
    cardAlphaLight: 0.88,
    strongAlphaLight: 0.93,
    softAlphaLight: 0.70,
    inputAlphaLight: 0.94,
    cardAlphaDark: 0.85,
    strongAlphaDark: 0.91,
    softAlphaDark: 0.66,
    inputAlphaDark: 0.90,
    blurPx: 10,
  },
];

export const ACCENT_SWATCHES = [
  { label: 'Teal Sky', hex: '#0F766E', secondary: '#0284C7' },
  { label: 'Coral Flame', hex: '#E11D48', secondary: '#EA580C' },
  { label: 'Berry Indigo', hex: '#A21CAF', secondary: '#4F46E5' },
  { label: 'Ocean Mint', hex: '#0369A1', secondary: '#0D9488' },
  { label: 'Matcha Leaf', hex: '#15803D', secondary: '#0F766E' },
  { label: 'Prism Violet', hex: '#4338CA', secondary: '#BE185D' },
];

export function getThemePreset(id?: ThemePresetId): ThemePresetDefinition {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export function getBackgroundPattern(id?: BackgroundPatternId): BackgroundPatternDefinition {
  return BACKGROUND_PATTERNS.find((p) => p.id === id) ?? BACKGROUND_PATTERNS[0];
}

export function getTranslucencyLevel(id?: SurfaceTranslucency): TranslucencyDefinition {
  return TRANSLUCENCY_LEVELS.find((t) => t.id === id) ?? TRANSLUCENCY_LEVELS[1];
}

export function normalizeBrandingConfig(raw: Partial<BrandingConfig> | undefined): BrandingConfig {
  const validPreset = THEME_PRESETS.some((p) => p.id === raw?.themePreset)
    ? (raw!.themePreset as ThemePresetId)
    : DEFAULT_THEME_PRESET;
  const validPattern = BACKGROUND_PATTERNS.some((p) => p.id === raw?.backgroundPattern)
    ? (raw!.backgroundPattern as BackgroundPatternId)
    : DEFAULT_BG_PATTERN;
  const validTranslucency = TRANSLUCENCY_LEVELS.some((t) => t.id === raw?.surfaceTranslucency)
    ? (raw!.surfaceTranslucency as SurfaceTranslucency)
    : DEFAULT_TRANSLUCENCY;

  const preset = getThemePreset(validPreset);
  const accentColor =
    raw?.accentColor && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor)
      ? raw.accentColor
      : preset.accentHex;

  return {
    workspaceName: raw?.workspaceName?.trim() || 'Cadence Studio',
    workspaceTagline: raw?.workspaceTagline?.trim() || 'Editorial Social Operations',
    accentColor,
    themeMode: raw?.themeMode === 'dark' ? 'dark' : 'light',
    themePreset: validPreset,
    backgroundPattern: validPattern,
    surfaceTranslucency: validTranslucency,
    density: raw?.density === 'compact' ? 'compact' : 'comfortable',
    cornerRadius:
      raw?.cornerRadius === 'sharp' || raw?.cornerRadius === 'soft'
        ? raw.cornerRadius
        : 'balanced',
    fontPair:
      raw?.fontPair === 'outfit' || raw?.fontPair === 'fraunces' ? raw.fontPair : 'jakarta',
    showWatermarkInPreviews: Boolean(raw?.showWatermarkInPreviews),
  };
}

export function resolveSecondaryAccent(accentHex: string, preset: ThemePresetDefinition): string {
  if (accentHex.toLowerCase() === preset.accentHex.toLowerCase()) {
    return preset.secondaryHex;
  }
  const matchedSwatch = ACCENT_SWATCHES.find(
    (s) => s.hex.toLowerCase() === accentHex.toLowerCase()
  );
  if (matchedSwatch) return matchedSwatch.secondary;
  return preset.secondaryHex;
}

export function resolveThemeCssVars(branding: BrandingConfig): Record<string, string> {
  const normalized = normalizeBrandingConfig(branding);
  const preset = getThemePreset(normalized.themePreset);
  const pattern = getBackgroundPattern(normalized.backgroundPattern);
  const translucency = getTranslucencyLevel(normalized.surfaceTranslucency);
  const mode: ThemeMode = normalized.themeMode;
  const palette = mode === 'dark' ? preset.dark : preset.light;
  const secondaryAccent = resolveSecondaryAccent(normalized.accentColor, preset);

  const cardAlpha = mode === 'dark' ? translucency.cardAlphaDark : translucency.cardAlphaLight;
  const strongAlpha =
    mode === 'dark' ? translucency.strongAlphaDark : translucency.strongAlphaLight;
  const softAlpha = mode === 'dark' ? translucency.softAlphaDark : translucency.softAlphaLight;
  const inputAlpha = mode === 'dark' ? translucency.inputAlphaDark : translucency.inputAlphaLight;

  const patternImage =
    mode === 'dark'
      ? pattern.getDarkImage(normalized.accentColor)
      : pattern.getLightImage(normalized.accentColor);

  const radiusMap = {
    sharp: ['2px', '4px'],
    balanced: ['8px', '12px'],
    soft: ['14px', '18px'],
  };
  const [r, rLg] = radiusMap[normalized.cornerRadius] ?? ['8px', '12px'];

  const fontMap = {
    jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
    outfit: "'Outfit', system-ui, sans-serif",
    fraunces: "'Fraunces', Georgia, serif",
  };

  const shadow =
    mode === 'dark'
      ? '0 10px 30px -14px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      : '0 8px 28px -12px rgba(15, 23, 42, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.72)';

  return {
    '--brand-accent': normalized.accentColor,
    '--brand-accent-secondary': secondaryAccent,
    '--brand-accent-hover': normalized.accentColor,
    '--brand-accent-soft': `${normalized.accentColor}${mode === 'dark' ? '2E' : '1C'}`,
    '--brand-accent-border': `${normalized.accentColor}${mode === 'dark' ? '59' : '4D'}`,
    '--canvas-bg-color': palette.baseColor,
    '--canvas-gradient': palette.gradient,
    '--canvas-pattern': patternImage,
    '--canvas-pattern-size': pattern.size,
    '--surface-glass': `rgba(${palette.surfaceRgb}, ${cardAlpha})`,
    '--surface-glass-strong': `rgba(${palette.strongRgb}, ${strongAlpha})`,
    '--surface-glass-soft': `rgba(${palette.softRgb}, ${softAlpha})`,
    '--surface-input': `rgba(${palette.inputRgb}, ${inputAlpha})`,
    '--surface-border': palette.border,
    '--surface-divider': palette.divider,
    '--surface-shadow': shadow,
    '--glass-blur': `${translucency.blurPx}px`,
    '--ui-radius': r,
    '--ui-radius-lg': rLg,
    '--font-display': fontMap[normalized.fontPair] ?? fontMap.jakarta,
  };
}
