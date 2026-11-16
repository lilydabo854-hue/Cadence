import React, { useState } from 'react';
import type {
  BrandingConfig,
  CornerRadius,
  FontPair,
  PlatformId,
  Project,
  ThemeMode,
  UiDensity,
} from '../types/workspace';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import {
  ACCENT_SWATCHES,
  BACKGROUND_PATTERNS,
  THEME_PRESETS,
  TRANSLUCENCY_LEVELS,
  getThemePreset,
  normalizeBrandingConfig,
} from '../utils/themes';
import { PlatformIcon } from './PlatformIcon';
import { Check } from 'lucide-react';

interface BrandStudioViewProps {
  branding: BrandingConfig;
  project: Project;
  onUpdateBranding: (patch: Partial<BrandingConfig>) => Promise<void>;
  onUpdateConnectedPlatforms: (platforms: PlatformId[]) => Promise<void>;
}

export const BrandStudioView: React.FC<BrandStudioViewProps> = ({
  branding,
  project,
  onUpdateBranding,
  onUpdateConnectedPlatforms,
}) => {
  const normalized = normalizeBrandingConfig(branding);
  const activePreset = getThemePreset(normalized.themePreset);

  const [nameInput, setNameInput] = useState(normalized.workspaceName);
  const [taglineInput, setTaglineInput] = useState(normalized.workspaceTagline);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const applyChange = async (patch: Partial<BrandingConfig>, notice?: string) => {
    await onUpdateBranding(patch);
    if (notice) {
      setSavedNotice(notice);
      setTimeout(() => setSavedNotice(null), 2500);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyChange(
      {
        workspaceName: nameInput.trim() || 'Cadence Studio',
        workspaceTagline: taglineInput.trim() || 'Editorial Social Operations',
      },
      'Workspace branding saved.'
    );
  };

  const toggleProjectPlatform = async (pid: PlatformId) => {
    const exists = project.connectedPlatforms.includes(pid);
    const next = exists
      ? project.connectedPlatforms.filter((p) => p !== pid)
      : [...project.connectedPlatforms, pid];
    if (next.length === 0) return;
    await onUpdateConnectedPlatforms(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Team Brand & Theme Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Customize gradient themes, translucent glass surfaces, background patterns, accent colors, and typography for your team.
          </p>
        </div>
        {savedNotice && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
            {savedNotice}
          </span>
        )}
      </div>

      {/* Gradient Theme Presets + Patterns */}
      <section className="theme-surface border brand-radius-lg p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Gradient Themes & Translucent Atmosphere
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Choose a multi-stop gradient backdrop and translucent glass finish for the workspace canvas.
            </p>
          </div>

          <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius self-start sm:self-auto">
            {(['light', 'dark'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => applyChange({ themeMode: mode }, `Switched to ${mode} mode.`)}
                className={`px-3.5 py-1.5 text-xs font-medium capitalize brand-radius cursor-pointer whitespace-nowrap ${
                  normalized.themeMode === mode
                    ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>
        </div>

        {/* 6 Gradient Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {THEME_PRESETS.map((preset) => {
            const active = normalized.themePreset === preset.id;
            const palette = normalized.themeMode === 'dark' ? preset.dark : preset.light;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  applyChange(
                    {
                      themePreset: preset.id,
                      accentColor: preset.accentHex,
                    },
                    `Theme set to ${preset.label}.`
                  )
                }
                className={`text-left p-2.5 border brand-radius-lg transition-all cursor-pointer ${
                  active
                    ? 'brand-accent-border theme-surface-strong ring-1 ring-current/15'
                    : 'theme-surface-soft hover:border-slate-400/50 dark:hover:border-white/25'
                }`}
              >
                <div
                  className="h-20 w-full brand-radius p-2.5 flex items-end justify-between border border-white/40 dark:border-white/10"
                  style={{
                    backgroundColor: palette.baseColor,
                    backgroundImage: palette.gradient,
                  }}
                >
                  {/* Mini translucent card preview inside swatch */}
                  <div
                    className="w-3/5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium backdrop-blur-md"
                    style={{
                      backgroundColor: `rgba(${palette.surfaceRgb}, 0.76)`,
                      borderColor: palette.border,
                      color: normalized.themeMode === 'dark' ? '#F8FAFC' : '#0F172A',
                    }}
                  >
                    {preset.label}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${preset.accentHex}, ${preset.secondaryHex})`,
                    }}
                  >
                    {active && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                  </div>
                </div>
                <div className="px-1 pt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {preset.vibe}
                    </div>
                  </div>
                  <div className="flex items-center -space-x-1 shrink-0" aria-hidden="true">
                    {preset.previewSwatches.map((hex) => (
                      <span
                        key={hex}
                        className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-900"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Background Patterns & Glass Translucency */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 border-t theme-divider">
          <div className="lg:col-span-8 space-y-2.5">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Background Pattern Overlay
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BACKGROUND_PATTERNS.map((pattern) => {
                const active = normalized.backgroundPattern === pattern.id;
                const activePalette =
                  normalized.themeMode === 'dark' ? activePreset.dark : activePreset.light;
                const patImg =
                  normalized.themeMode === 'dark'
                    ? pattern.getDarkImage(normalized.accentColor)
                    : pattern.getLightImage(normalized.accentColor);
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      applyChange(
                        { backgroundPattern: pattern.id },
                        `Pattern set to ${pattern.label}.`
                      )
                    }
                    className={`p-2.5 border brand-radius text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                      active
                        ? 'brand-accent-soft-bg brand-accent-border text-slate-900 dark:text-slate-50'
                        : 'theme-surface-soft text-slate-700 dark:text-slate-300 hover:border-slate-400/50 dark:hover:border-white/25'
                    }`}
                  >
                    <span
                      className="relative w-9 h-9 rounded-md shrink-0 overflow-hidden border border-white/40 dark:border-white/10"
                      style={{
                        backgroundColor: activePalette.baseColor,
                        backgroundImage: activePalette.gradient,
                      }}
                      aria-hidden="true"
                    >
                      <span
                        className="absolute inset-0"
                        style={{
                          backgroundImage: patImg,
                          backgroundSize: pattern.size,
                          backgroundRepeat: 'repeat',
                        }}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold truncate">
                        {pattern.label}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {pattern.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-2.5">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Surface Translucency
            </span>
            <div className="space-y-2">
              {TRANSLUCENCY_LEVELS.map((level) => {
                const active = normalized.surfaceTranslucency === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      applyChange(
                        { surfaceTranslucency: level.id },
                        `Glass finish set to ${level.label}.`
                      )
                    }
                    className={`w-full px-3 py-2 border brand-radius text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'brand-accent-soft-bg brand-accent-border text-slate-900 dark:text-slate-50'
                        : 'theme-surface-soft text-slate-700 dark:text-slate-300 hover:border-slate-400/50'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold">{level.label}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {level.description}
                      </span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 brand-accent-text shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Identity */}
        <form
          onSubmit={handleSaveIdentity}
          className="theme-surface border brand-radius-lg p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Team Wordmark & Preview Branding
          </h2>

          <div>
            <label htmlFor="brand-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workspace Brand Name
            </label>
            <input
              id="brand-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label htmlFor="brand-tagline" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subtitle / Team Descriptor
            </label>
            <input
              id="brand-tagline"
              type="text"
              value={taglineInput}
              onChange={(e) => setTaglineInput(e.target.value)}
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={normalized.showWatermarkInPreviews}
              onChange={(e) =>
                applyChange({ showWatermarkInPreviews: e.target.checked })
              }
            />
            Display team wordmark overlay on post composer media previews
          </label>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
          >
            Update Workspace Identity
          </button>
        </form>

        {/* Visual Tokens */}
        <section className="theme-surface border brand-radius-lg p-5 space-y-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Accent Gradient & Typography
          </h2>

          {/* Accent Color */}
          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Primary Gradient Accent
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_SWATCHES.map((swatch) => {
                const active = normalized.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => applyChange({ accentColor: swatch.hex }, `Accent set to ${swatch.label}.`)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border brand-radius cursor-pointer ${
                      active
                        ? 'brand-accent-border theme-surface-strong text-slate-900 dark:text-slate-50'
                        : 'theme-surface-soft text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${swatch.hex}, ${swatch.secondary})`,
                      }}
                    />
                    {swatch.label}
                  </button>
                );
              })}

              <label className="inline-flex items-center gap-2 px-2.5 py-1 text-xs border theme-surface-soft brand-radius text-slate-700 dark:text-slate-300 cursor-pointer">
                Custom
                <input
                  type="color"
                  aria-label="Custom accent hex color"
                  value={normalized.accentColor}
                  onChange={(e) => applyChange({ accentColor: e.target.value })}
                  className="w-5 h-5 border-0 bg-transparent cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Font Pairing, Radius, Density */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="font-pair" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Typeface
              </label>
              <select
                id="font-pair"
                value={normalized.fontPair}
                onChange={(e) =>
                  applyChange({ fontPair: e.target.value as FontPair }, 'Typography updated.')
                }
                className="w-full px-2.5 py-2 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                <option value="jakarta">Plus Jakarta Sans</option>
                <option value="outfit">Outfit Geometric</option>
                <option value="fraunces">Fraunces Editorial</option>
              </select>
            </div>

            <div>
              <label htmlFor="corner-radius" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Corner Geometry
              </label>
              <select
                id="corner-radius"
                value={normalized.cornerRadius}
                onChange={(e) =>
                  applyChange({ cornerRadius: e.target.value as CornerRadius }, 'Corner geometry updated.')
                }
                className="w-full px-2.5 py-2 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                <option value="sharp">Sharp (2px)</option>
                <option value="balanced">Balanced (8px)</option>
                <option value="soft">Soft (14px)</option>
              </select>
            </div>

            <div>
              <label htmlFor="ui-density" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Layout Density
              </label>
              <select
                id="ui-density"
                value={normalized.density}
                onChange={(e) =>
                  applyChange({ density: e.target.value as UiDensity }, 'Density updated.')
                }
                className="w-full px-2.5 py-2 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* Connected Social Channels for Active Project */}
      <section className="theme-surface border brand-radius-lg p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Connected Channels — {project.name}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
          Toggle active publishing integrations across LinkedIn, Instagram, Facebook, X, YouTube, Pinterest, and TikTok.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ALL_PLATFORMS.map((pid) => {
            const connected = project.connectedPlatforms.includes(pid);
            const spec = PLATFORM_SPECS[pid];
            return (
              <div
                key={pid}
                className="p-3.5 theme-surface-soft border brand-radius flex items-center justify-between gap-3"
              >
                <div>
                  <PlatformIcon platform={pid} size={16} showLabel />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {connected ? 'Publishing Active' : 'Paused'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProjectPlatform(pid)}
                  aria-label={`Toggle ${spec.label} connection`}
                  className={`px-2.5 py-1 text-xs font-medium brand-radius cursor-pointer ${
                    connected
                      ? 'brand-accent-soft-bg brand-accent-text'
                      : 'theme-input border text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
