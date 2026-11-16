import React, { useState } from 'react';
import type { PlatformId, Project, SocialPost, BrandingConfig } from '../types/workspace';
import {
  ALL_PLATFORMS,
  PLATFORM_SPECS,
  calculateAnalyticsSummary,
  formatCompactNumber,
} from '../utils/scheduler';
import { PlatformIcon, StatusLabel } from './PlatformIcon';
import { TrendChart } from './TrendChart';
import { ArrowRight, CalendarClock, Sparkles, TrendingUp, Users } from 'lucide-react';
import { resolveMediaUrl } from '../assets/media';

interface OverviewViewProps {
  project: Project;
  posts: SocialPost[];
  branding: BrandingConfig;
  onNavigate: (view: 'calendar' | 'approvals' | 'analytics' | 'ai-insights' | 'content-bank') => void;
  onOpenComposer: (post?: SocialPost) => void;
  onAutoFillSchedule: () => void;
  isAutoScheduling: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  project,
  posts,
  branding,
  onNavigate,
  onOpenComposer,
  onAutoFillSchedule,
  isAutoScheduling,
}) => {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [chartMetric, setChartMetric] = useState<'reach' | 'followers' | 'engagements'>('reach');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');

  const summary = calculateAnalyticsSummary(posts, project.analyticsSeries, platformFilter, rangeDays);
  const slicedSeries = project.analyticsSeries.slice(-rangeDays);

  const upcomingPosts = posts
    .filter((p) => p.status === 'Scheduled' || p.status === 'Approved')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const pendingApprovals = posts.filter(
    (p) => p.status === 'In Review' || p.status === 'Changes Requested'
  );

  const pad = branding.density === 'compact' ? 'p-4' : 'p-5';

  return (
    <div className="space-y-6">
      {/* Project Header Context */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b theme-divider pb-5">
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {project.industry} · {project.handle} · {project.connectedPlatforms.length} active channels
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
            {project.name} Command Center
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl">
            {project.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAutoFillSchedule}
            disabled={isAutoScheduling}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium border theme-surface-strong text-slate-800 dark:text-slate-100 hover:brightness-105 brand-radius transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <CalendarClock className="w-4 h-4" aria-hidden="true" />
            {isAutoScheduling ? 'Scheduling...' : 'Auto-Schedule Queue'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-insights')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            View AI Insights
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Total Audience</span>
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {formatCompactNumber(project.followersTotal)}
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              +{project.followerGrowth30dPct}% · 30d
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            Across {project.connectedPlatforms.length} connected networks
          </p>
        </div>

        <div className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Campaign Reach</span>
            <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {formatCompactNumber(summary.totalReach)}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-mono tabular-nums">
              {formatCompactNumber(summary.totalImpressions)} impr.
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            From {summary.publishedCount} published {summary.publishedCount === 1 ? 'post' : 'posts'}
          </p>
        </div>

        <div className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Avg Engagement Rate</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {summary.avgEngagementRate}%
            </span>
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              {formatCompactNumber(summary.totalSaves)} saves
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            {formatCompactNumber(summary.totalClicks)} outbound link clicks
          </p>
        </div>

        <div className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Publishing Queue</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
              {summary.scheduledCount}
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 font-mono tabular-nums">
              {summary.pendingApprovalCount} awaiting approval
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
            Auto-scheduling {project.autoScheduleEnabled ? 'active' : 'manual'}
          </p>
        </div>
      </div>

      {/* Main Grid: Performance Chart + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className={`xl:col-span-2 theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Cross-Platform Performance Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily reach, engagement volume, and audience growth
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
                {(['reach', 'engagements', 'followers'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMetric(m)}
                    className={`px-2 py-1 text-xs font-medium brand-radius transition-colors capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                      chartMetric === m
                        ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
                {([7, 30, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRangeDays(d)}
                    className={`px-2 py-1 text-xs font-medium font-mono brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      rangeDays === d
                        ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <TrendChart
            data={slicedSeries}
            metric={chartMetric}
            accentColor={branding.accentColor}
          />

          {/* Platform filter strip */}
          <div className="mt-4 pt-4 border-t theme-divider flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setPlatformFilter('all')}
                className={`px-2 py-1 text-xs font-medium brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  platformFilter === 'all'
                    ? 'brand-accent-soft-bg brand-accent-text'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                All
              </button>
              {ALL_PLATFORMS.map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setPlatformFilter(pid)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    platformFilter === pid
                      ? 'brand-accent-soft-bg brand-accent-text'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
                  }`}
                >
                  <PlatformIcon platform={pid} size={12} />
                  {PLATFORM_SPECS[pid].label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-1 text-xs font-medium brand-accent-text hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* AI Optimization Recommendations */}
        <section className={`theme-surface border brand-radius-lg ${pad} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                AI Optimization Priorities
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('ai-insights')}
                className="text-xs font-medium brand-accent-text hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Studio
              </button>
            </div>

            {project.insights.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  No optimization insights generated for {project.name} yet.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('ai-insights')}
                  className="px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
                >
                  Analyze Performance
                </button>
              </div>
            ) : (
              <div className="divide-y theme-divider">
                {project.insights.slice(0, 3).map((ins) => (
                  <div key={ins.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {ins.platform !== 'all' && <PlatformIcon platform={ins.platform} size={13} showLabel />}
                      {ins.platform === 'all' && <span className="whitespace-nowrap">Cross-Channel</span>}
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        +{ins.predictedLiftPct}% est. lift
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{ins.bestWindow}</span>
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                      {ins.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {ins.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenComposer()}
            className="mt-4 w-full py-2 px-3 text-xs font-medium border theme-surface-soft text-slate-800 dark:text-slate-100 hover:brightness-105 brand-radius transition-all cursor-pointer"
          >
            Draft Optimized Post
          </button>
        </section>
      </div>

      {/* Bottom Split: Upcoming Scheduled Queue + Team Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Upcoming Scheduled Queue
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs font-medium brand-accent-text hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Calendar
            </button>
          </div>

          {upcomingPosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No posts scheduled yet. Create a post or run Auto-Schedule Queue.
            </div>
          ) : (
            <div className="divide-y theme-divider">
              {upcomingPosts.map((post) => {
                const imgUrl = resolveMediaUrl(post.mediaKey);
                return (
                  <div key={post.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover brand-radius shrink-0 border theme-divider"
                        />
                      ) : (
                        <div className="w-10 h-10 theme-surface-soft brand-radius shrink-0" />
                      )}
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenComposer(post)}
                          className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline truncate block text-left cursor-pointer"
                        >
                          {post.title}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono tabular-nums">
                            {new Date(post.scheduledAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{post.format}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        {post.platforms.slice(0, 3).map((pid) => (
                          <PlatformIcon key={pid} platform={pid} size={13} />
                        ))}
                      </div>
                      <StatusLabel status={post.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={`theme-surface border brand-radius-lg ${pad}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Pending Team Approvals
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="text-xs font-medium brand-accent-text hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Review All ({pendingApprovals.length})
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              All queued posts have been reviewed and cleared.
            </div>
          ) : (
            <div className="divide-y theme-divider">
              {pendingApprovals.slice(0, 5).map((post) => (
                <div key={post.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('approvals')}
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:underline truncate block text-left cursor-pointer"
                    >
                      {post.title}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Assignee: {post.assignee} · {post.comments.length} comment{post.comments.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusLabel status={post.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
