import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKGROUND_PATTERNS,
  THEME_PRESETS,
  TRANSLUCENCY_LEVELS,
  normalizeBrandingConfig,
  resolveThemeCssVars,
} from './themes';
import type { BrandingConfig } from '../types/workspace';

test('normalizeBrandingConfig backfills fun gradient theme defaults for legacy configs', () => {
  const legacy: Partial<BrandingConfig> = {
    workspaceName: 'Northline',
    workspaceTagline: 'Coffee Stories',
    accentColor: '#1D4ED8',
    themeMode: 'light',
    density: 'compact',
    cornerRadius: 'soft',
    fontPair: 'fraunces',
    showWatermarkInPreviews: true,
  };

  const normalized = normalizeBrandingConfig(legacy);
  assert.equal(normalized.themePreset, 'aurora');
  assert.equal(normalized.backgroundPattern, 'terrazzo');
  assert.equal(normalized.surfaceTranslucency, 'frosted');
  assert.equal(normalized.density, 'compact');
  assert.equal(normalized.cornerRadius, 'soft');
  assert.equal(normalized.fontPair, 'fraunces');
  assert.equal(normalized.accentColor, '#1D4ED8');
});

test('resolveThemeCssVars generates multi-stop gradients, patterns, and translucent rgba surfaces for all presets in light & dark modes', () => {
  for (const preset of THEME_PRESETS) {
    for (const mode of ['light', 'dark'] as const) {
      const vars = resolveThemeCssVars({
        workspaceName: 'Cadence Studio',
        workspaceTagline: 'Editorial Social Operations',
        accentColor: preset.accentHex,
        themeMode: mode,
        themePreset: preset.id,
        backgroundPattern: 'waves',
        surfaceTranslucency: 'sheer',
        density: 'comfortable',
        cornerRadius: 'balanced',
        fontPair: 'jakarta',
        showWatermarkInPreviews: false,
      });

      assert.ok(vars['--canvas-gradient'].includes('radial-gradient'));
      assert.ok(vars['--canvas-gradient'].includes('linear-gradient'));
      assert.ok(vars['--canvas-pattern'].includes('data:image/svg+xml'));
      assert.equal(vars['--canvas-pattern-size'], '64px 32px');
      assert.ok(vars['--surface-glass'].startsWith('rgba('));
      assert.ok(vars['--surface-glass-strong'].startsWith('rgba('));
      assert.ok(vars['--surface-glass-soft'].startsWith('rgba('));
      assert.equal(vars['--glass-blur'], '18px');
      assert.equal(vars['--brand-accent'], preset.accentHex);
      assert.equal(vars['--brand-accent-secondary'], preset.secondaryHex);
    }
  }
});

test('all background patterns and translucency levels produce distinct CSS values', () => {
  const seenPatterns = new Set<string>();
  for (const pattern of BACKGROUND_PATTERNS) {
    const vars = resolveThemeCssVars({
      workspaceName: 'Cadence Studio',
      workspaceTagline: 'Editorial Social Operations',
      accentColor: '#0F766E',
      themeMode: 'light',
      themePreset: 'aurora',
      backgroundPattern: pattern.id,
      surfaceTranslucency: 'frosted',
      density: 'comfortable',
      cornerRadius: 'balanced',
      fontPair: 'jakarta',
      showWatermarkInPreviews: false,
    });
    seenPatterns.add(vars['--canvas-pattern']);
  }
  assert.equal(seenPatterns.size, BACKGROUND_PATTERNS.length);

  const alphas = TRANSLUCENCY_LEVELS.map((level) => {
    const vars = resolveThemeCssVars({
      workspaceName: 'Cadence Studio',
      workspaceTagline: 'Editorial Social Operations',
      accentColor: '#0F766E',
      themeMode: 'light',
      themePreset: 'aurora',
      backgroundPattern: 'dots',
      surfaceTranslucency: level.id,
      density: 'comfortable',
      cornerRadius: 'balanced',
      fontPair: 'jakarta',
      showWatermarkInPreviews: false,
    });
    return vars['--surface-glass'];
  });
  assert.equal(new Set(alphas).size, 3);
});
