import React, { useMemo, useState } from 'react';
import type { BrandingConfig, PlatformId, Project, SocialPost } from '../types/workspace';
import {
  ALL_PLATFORMS,
  PLATFORM_SPECS,
  calculateAnalyticsSummary,
  formatCompactNumber,
  rankPostsByEngagement,
} from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { TrendChart } from './TrendChart';
import { ArrowUpDown, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  project: Project;
  posts: SocialPost[];
  branding: BrandingConfig;
  onNavigateAiInsights: () => void;
}

type SortField = 'engagementRate' | 'reach' | 'impressions' | 'clicks' | 'saves';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  project,
  posts,
  branding,
  onNavigateAiInsights,
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [chartMetric, setChartMetric] = useState<'reach' | 'followers' | 'engagements'>('followers');
  const [sortBy, setSortBy] = useState<SortField>('engagementRate');

  const slicedSeries = useMemo(
    () => project.analyticsSeries.slice(-rangeDays),
    [project.analyticsSeries, rangeDays]
  );

  const summary = useMemo(
    () => calculateAnalyticsSummary(posts, project.analyticsSeries, platformFilter, rangeDays),
    [posts, project.analyticsSeries, platformFilter, rangeDays]
  );

  const rankedPosts = useMemo(() => {
    const filtered = posts.filter((p) =>
      platformFilter === 'all' ? true : p.platforms.includes(platformFilter)
    );
    return rankPostsByEngagement(filtered, sortBy);
  }, [posts, platformFilter, sortBy]);

  const platformTotals = useMemo(() => {
    const totals: Record<PlatformId, number> = {
      linkedin: 0,
      instagram: 0,
      facebook: 0,
      x: 0,
      youtube: 0,
      pinterest: 0,
      tiktok: 0,
    };
    for (const pt of slicedSeries) {
      for (const pid of ALL_PLATFORMS) {
        totals[pid] += pt.platformBreakdown[pid] || 0;
      }
    }
    const maxVal = Math.max(1, ...Object.values(totals));
    return { totals, maxVal };
  }, [slicedSeries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Analytics & Performance Trends
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Post-level attribution, audience velocity, and channel-by-channel reach for {project.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-3 py-1.5 text-xs font-medium font-mono brand-radius cursor-pointer whitespace-nowrap shrink-0 ${
                  rangeDays === d
                    ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onNavigateAiInsights}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            AI Optimization Insights
          </button>
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setPlatformFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium brand-radius whitespace-nowrap shrink-0 cursor-pointer ${
            platformFilter === 'all'
              ? 'brand-accent-soft-bg brand-accent-text'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
        >
          All Networks
        </button>
        {ALL_PLATFORMS.map((pid) => (
          <button
            key={pid}
            type="button"
            onClick={() => setPlatformFilter(pid)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium brand-radius whitespace-nowrap shrink-0 cursor-pointer ${
              platformFilter === pid
                ? 'brand-accent-soft-bg brand-accent-text'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
            }`}
          >
            <PlatformIcon platform={pid} size={13} />
            {PLATFORM_SPECS[pid].label}
          </button>
        ))}
      </div>

      {/* 4 Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-surface border brand-radius-lg p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Impressions</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
            {formatCompactNumber(summary.totalImpressions)}
          </p>
        </div>
        <div className="theme-surface border brand-radius-lg p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Unique Reach</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
            {formatCompactNumber(summary.totalReach)}
          </p>
        </div>
        <div className="theme-surface border brand-radius-lg p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Engagement Rate</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {summary.avgEngagementRate}%
          </p>
        </div>
        <div className="theme-surface border brand-radius-lg p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Saves & Outbound Clicks</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
            {formatCompactNumber(summary.totalSaves + summary.totalClicks)}
          </p>
        </div>
      </div>

      {/* Dual Panel: Audience Growth & Reach Trend + Platform Share */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 theme-surface border brand-radius-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Audience Growth & Engagement Velocity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracking cumulative follower trajectory and daily engagement volume
              </p>
            </div>
            <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
              {(['followers', 'reach', 'engagements'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setChartMetric(m)}
                  className={`px-2.5 py-1 text-xs font-medium capitalize brand-radius cursor-pointer whitespace-nowrap shrink-0 ${
                    chartMetric === m
                      ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <TrendChart
            data={slicedSeries}
            metric={chartMetric}
            accentColor={branding.accentColor}
          />
        </section>

        <section className="theme-surface border brand-radius-lg p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-1">
            Channel Reach Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Last {rangeDays} days across connected platforms
          </p>

          <div className="space-y-3.5">
            {ALL_PLATFORMS.map((pid) => {
              const val = platformTotals.totals[pid];
              const widthPct = Math.max(4, Math.round((val / platformTotals.maxVal) * 100));
              return (
                <div key={pid} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <PlatformIcon platform={pid} size={13} showLabel />
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatCompactNumber(val)}
                    </span>
                  </div>
                  <div className="h-2 theme-surface-soft rounded-sm overflow-hidden">
                    <div
                      className="h-full brand-accent-bg rounded-sm transition-all duration-300"
                      style={{
                        width: `${widthPct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Post-Level Performance Table */}
      <section className="theme-surface border brand-radius-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Post-Level Performance Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any metric header to rank published posts
            </p>
          </div>
        </div>

        {rankedPosts.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No published posts with analytics for this filter yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b theme-divider text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Post Title</th>
                  <th className="py-2.5 px-3">Channels</th>
                  <th className="py-2.5 px-3">Published</th>
                  {(
                    [
                      { key: 'impressions', label: 'Impressions' },
                      { key: 'reach', label: 'Reach' },
                      { key: 'saves', label: 'Saves' },
                      { key: 'clicks', label: 'Clicks' },
                      { key: 'engagementRate', label: 'Eng. Rate' },
                    ] as const
                  ).map((col) => (
                    <th key={col.key} className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSortBy(col.key)}
                        className={`inline-flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 ${
                          sortBy === col.key ? 'brand-accent-text font-semibold' : ''
                        }`}
                      >
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y theme-divider text-sm">
                {rankedPosts.map((post) => {
                  const m = post.metrics!;
                  return (
                    <tr key={post.id} className="hover:bg-white/40 dark:hover:bg-white/5">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {post.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {post.format}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {post.platforms.map((pid) => (
                            <PlatformIcon key={pid} platform={pid} size={13} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {(post.publishedAt || post.scheduledAt).slice(0, 10)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {m.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {m.reach.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {m.saves.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {m.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                        {m.engagementRate.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
