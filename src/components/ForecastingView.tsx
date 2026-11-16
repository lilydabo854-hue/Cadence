import React, { useMemo, useState } from 'react';
import type {
  ContentFormat,
  PerformanceForecastReport,
  PlatformId,
  Project,
  SocialPost,
} from '../types/workspace';
import {
  buildForecastExportCsv,
  buildForecastExportMarkdown,
  computeAccountHistoricalBaseline,
} from '../utils/intelligence';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';

interface ForecastingViewProps {
  project: Project;
  posts: SocialPost[];
  onRunForecast: (params: {
    platform: PlatformId;
    format: ContentFormat;
    contentDescription: string;
  }) => Promise<PerformanceForecastReport>;
  onNotify?: (msg: string) => void;
}

const FORECAST_FORMATS: ContentFormat[] = [
  'Carousel',
  'Reel / Short',
  'Video',
  'Single Post',
  'Thread',
  'Pin',
  'Article',
];

function triggerTextDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({
  project,
  posts,
  onRunForecast,
  onNotify,
}) => {
  const forecasts = project.forecasts ?? [];
  const [selectedForecastId, setSelectedForecastId] = useState<string>(forecasts[0]?.id ?? '');

  const [platform, setPlatform] = useState<PlatformId>('instagram');
  const [format, setFormat] = useState<ContentFormat>('Carousel');
  const [contentDescription, setContentDescription] = useState(
    '5-slide carousel comparing barrier repair recovery across 14 days with clinical hydration data.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseline = useMemo(
    () => computeAccountHistoricalBaseline(posts, project.analyticsSeries, platform),
    [posts, project.analyticsSeries, platform]
  );

  const activeForecast = useMemo(() => {
    if (forecasts.length === 0) return null;
    return forecasts.find((f) => f.id === selectedForecastId) ?? forecasts[0];
  }, [forecasts, selectedForecastId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contentDescription.trim()) {
      setError('Describe the planned post content before running a forecast.');
      return;
    }

    setLoading(true);
    try {
      const report = await onRunForecast({
        platform,
        format,
        contentDescription: contentDescription.trim(),
      });
      setSelectedForecastId(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to forecast post performance.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (kind: 'csv' | 'md' | 'json') => {
    if (!activeForecast) return;
    const slug = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-forecast-${activeForecast.platform}`;
    if (kind === 'csv') {
      triggerTextDownload(
        `${slug}.csv`,
        buildForecastExportCsv(activeForecast, project.name),
        'text/csv;charset=utf-8;'
      );
      onNotify?.('Exported forecast report as CSV.');
    } else if (kind === 'md') {
      triggerTextDownload(
        `${slug}.md`,
        buildForecastExportMarkdown(activeForecast, project.name),
        'text/markdown;charset=utf-8;'
      );
      onNotify?.('Exported forecast report as Markdown.');
    } else {
      triggerTextDownload(
        `${slug}.json`,
        JSON.stringify({ project: project.name, ...activeForecast }, null, 2),
        'application/json;charset=utf-8;'
      );
      onNotify?.('Exported forecast report as JSON.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Performance Forecasting
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Predict reach, likes, comments, and shares for upcoming posts calibrated against {project.name} historical account data.
          </p>
        </div>

        {forecasts.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="forecast-history-select"
              className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              Saved Forecast
            </label>
            <select
              id="forecast-history-select"
              value={activeForecast?.id ?? ''}
              onChange={(e) => setSelectedForecastId(e.target.value)}
              className="px-3 py-1.5 text-xs theme-input border text-slate-800 dark:text-slate-100 brand-radius"
            >
              {forecasts.map((fc) => (
                <option key={fc.id} value={fc.id}>
                  {PLATFORM_SPECS[fc.platform]?.label} · {fc.format} · {fc.confidenceScore}% conf.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Split: Forecast Form + Historical Baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 theme-surface border brand-radius-lg p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Content Forecast Brief
          </h2>

          {error && (
            <div
              role="alert"
              className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 brand-radius"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="forecast-platform"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Target Platform
              </label>
              <select
                id="forecast-platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                {ALL_PLATFORMS.map((pid) => (
                  <option key={pid} value={pid}>
                    {PLATFORM_SPECS[pid].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="forecast-format"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Content Format
              </label>
              <select
                id="forecast-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as ContentFormat)}
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              >
                {FORECAST_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="forecast-description"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Content Description & Creative Angle
            </label>
            <textarea
              id="forecast-description"
              rows={4}
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              placeholder="Describe the hook, topic, visual style, call-to-action, and offer..."
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {loading ? 'Modeling Forecast...' : 'Predict Performance'}
            </button>
          </div>
        </form>

        {/* Account Historical Baseline Panel */}
        <aside className="lg:col-span-5 theme-surface border brand-radius-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Historical Account Baseline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calibrated from {baseline.samplePosts} published post{baseline.samplePosts === 1 ? '' : 's'} and 30-day analytics
              </p>
            </div>
            <PlatformIcon platform={platform} size={15} showLabel />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t theme-divider">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Post Reach</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                {baseline.avgReach.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Engagement Rate</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                {baseline.avgEngagementRate}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Likes / Post</div>
              <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                {baseline.avgLikes.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg Comments / Shares</div>
              <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                {baseline.avgComments.toLocaleString()} / {baseline.avgShares.toLocaleString()}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Forecast Results & Export Controls */}
      {!activeForecast ? (
        <div className="theme-surface border brand-radius-lg py-14 px-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No performance forecasts generated yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Fill in the planned content brief above to project reach, likes, comments, shares, and confidence score.
          </p>
        </div>
      ) : (
        <section className="theme-surface border brand-radius-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b theme-divider pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <PlatformIcon platform={activeForecast.platform} size={14} showLabel />
                <span aria-hidden="true">·</span>
                <span>{activeForecast.format}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date(activeForecast.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Predicted Post Outcome
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {activeForecast.contentDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('md')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export Markdown
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Forecasted Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Predicted Reach</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {activeForecast.predictedReach.toLocaleString()}
              </div>
            </div>
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Predicted Likes</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {activeForecast.predictedLikes.toLocaleString()}
              </div>
            </div>
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Predicted Comments</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {activeForecast.predictedComments.toLocaleString()}
              </div>
            </div>
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Predicted Shares</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {activeForecast.predictedShares.toLocaleString()}
              </div>
            </div>
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Engagement Rate</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                {activeForecast.predictedEngagementRate}%
              </div>
            </div>
            <div className="py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">Confidence Score</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                {activeForecast.confidenceScore}%
              </div>
            </div>
          </div>

          <div className="pt-4 border-t theme-divider space-y-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Forecast Interpretation
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeForecast.summary}
            </p>
          </div>

          <div className="pt-4 border-t theme-divider space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Key Factors Influencing This Forecast
            </h3>
            <div className="divide-y theme-divider">
              {activeForecast.factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {factor.label}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{factor.detail}</p>
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                      factor.impact === 'Positive'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : factor.impact === 'Risk'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {factor.impact} Impact
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
