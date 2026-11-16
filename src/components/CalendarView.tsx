import React, { useMemo, useState } from 'react';
import type { AutoScheduleRule, PlatformId, Project, SocialPost } from '../types/workspace';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon, StatusLabel } from './PlatformIcon';
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react';
import { resolveMediaUrl } from '../assets/media';

interface CalendarViewProps {
  project: Project;
  posts: SocialPost[];
  onOpenComposer: (post?: SocialPost, prefillDateIso?: string) => void;
  onAutoFillSchedule: (includeDrafts: boolean) => Promise<void>;
  onUpdateScheduleRules: (enabled: boolean, rules: AutoScheduleRule[]) => Promise<void>;
  isAutoScheduling: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  posts,
  onOpenComposer,
  onAutoFillSchedule,
  onUpdateScheduleRules,
  isAutoScheduling,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'queue'>('month');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 10, 1)); // Nov 2026
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [draftRules, setDraftRules] = useState<AutoScheduleRule[]>(project.autoScheduleRules);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => (platformFilter === 'all' ? true : p.platforms.includes(platformFilter)))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [posts, platformFilter]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
      cells.push({ date: new Date(year, month + 1, nextDay), inMonth: false });
    }
    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const handleToggleRule = (pid: PlatformId) => {
    setDraftRules((prev) =>
      prev.map((r) => (r.platform === pid ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleWeeklyTargetChange = (pid: PlatformId, val: number) => {
    setDraftRules((prev) =>
      prev.map((r) => (r.platform === pid ? { ...r, weeklyTarget: Math.max(1, val) } : r))
    );
  };

  const handleSaveRules = async () => {
    await onUpdateScheduleRules(project.autoScheduleEnabled, draftRules);
    setShowRulesPanel(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Content Calendar & Automated Queue
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Plan multi-channel launches and automate conflict-free publishing slots across all 7 networks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setDraftRules(project.autoScheduleRules);
              setShowRulesPanel((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border theme-surface-strong text-slate-700 dark:text-slate-200 hover:brightness-105 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            Queue Rules
          </button>

          <button
            type="button"
            onClick={() => onAutoFillSchedule(includeDrafts)}
            disabled={isAutoScheduling}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border theme-surface-strong text-slate-800 dark:text-slate-100 hover:brightness-105 brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
            {isAutoScheduling ? 'Auto-Scheduling...' : 'Auto-Fill Optimal Slots'}
          </button>

          <button
            type="button"
            onClick={() => onOpenComposer()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Schedule Post
          </button>
        </div>
      </div>

      {/* Auto-Schedule Rules Drawer */}
      {showRulesPanel && (
        <section className="theme-surface border brand-radius-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Automated Scheduling Rules — {project.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure peak-engagement hours and weekly frequency targets per platform.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
                className="rounded border-slate-300"
              />
              Include Drafts when running Auto-Fill
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {draftRules.map((rule) => (
              <div
                key={rule.platform}
                className="p-3 border brand-radius theme-surface-soft space-y-2"
              >
                <div className="flex items-center justify-between">
                  <PlatformIcon platform={rule.platform} size={14} showLabel />
                  <input
                    type="checkbox"
                    aria-label={`Enable auto-schedule for ${PLATFORM_SPECS[rule.platform].label}`}
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.platform)}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Hours: {rule.preferredHours.map((h) => `${h}:00`).join(', ')}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Weekly target</span>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    aria-label={`${PLATFORM_SPECS[rule.platform].label} weekly target`}
                    value={rule.weeklyTarget}
                    onChange={(e) => handleWeeklyTargetChange(rule.platform, Number(e.target.value))}
                    className="w-14 px-2 py-1 text-right font-mono theme-input border brand-radius text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRulesPanel(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 brand-radius cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRules}
              className="px-3.5 py-1.5 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
            >
              Save Queue Rules
            </button>
          </div>
        </section>
      )}

      {/* Toolbar: View Switcher + Month Nav + Platform Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-0.5 theme-surface-soft border brand-radius">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'month'
                  ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('queue')}
              className={`px-3 py-1.5 text-xs font-medium brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'queue'
                  ? 'theme-surface-strong text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Queue List ({filteredPosts.length})
            </button>
          </div>

          {viewMode === 'month' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="p-1.5 border theme-surface-strong text-slate-700 dark:text-slate-200 hover:brightness-105 brand-radius cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 min-w-[130px] text-center">
                {monthLabel}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="p-1.5 border theme-surface-strong text-slate-700 dark:text-slate-200 hover:brightness-105 brand-radius cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setPlatformFilter('all')}
            className={`px-2 py-1 text-xs font-medium brand-radius whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium brand-radius whitespace-nowrap shrink-0 cursor-pointer ${
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
      </div>

      {/* Month Grid View */}
      {viewMode === 'month' ? (
        <div className="theme-surface border brand-radius-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b theme-divider theme-surface-soft">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 border-r last:border-r-0 theme-divider"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, inMonth }, idx) => {
              const isoDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                2,
                '0'
              )}-${String(date.getDate()).padStart(2, '0')}`;
              const dayPosts = filteredPosts.filter(
                (p) => p.scheduledAt.slice(0, 10) === isoDay
              );
              const isToday = isoDay === '2026-11-15';

              return (
                <div
                  key={idx}
                  className={`min-h-[118px] p-2 border-b border-r theme-divider flex flex-col justify-between ${
                    inMonth
                      ? 'bg-transparent'
                      : 'bg-slate-900/[0.03] dark:bg-black/20 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isToday
                          ? 'brand-accent-text font-bold'
                          : inMonth
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {date.getDate()}
                      {isToday && ' · Today'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Schedule post on ${isoDay}`}
                      onClick={() => onOpenComposer(undefined, `${isoDay}T12:00:00.000Z`)}
                      className="p-0.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 rounded cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => onOpenComposer(post)}
                        className="w-full text-left p-1.5 border theme-surface-soft hover:brightness-105 brand-radius transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {post.platforms.slice(0, 3).map((pid) => (
                              <PlatformIcon key={pid} platform={pid} size={11} />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {post.scheduledAt.slice(11, 16)}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {post.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Queue List View */
        <div className="theme-surface border brand-radius-lg divide-y theme-divider">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No posts match the selected platform filter.
            </div>
          ) : (
            filteredPosts.map((post) => {
              const imgUrl = resolveMediaUrl(post.mediaKey);
              return (
                <div
                  key={post.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/40 dark:hover:bg-white/5"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover brand-radius border theme-divider shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 theme-surface-soft brand-radius shrink-0" />
                    )}
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenComposer(post)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline text-left cursor-pointer"
                      >
                        {post.title}
                      </button>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {post.caption}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
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
                        <span aria-hidden="true">·</span>
                        <span>{post.autoScheduled ? 'Auto-Queued' : 'Manual Slot'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {post.platforms.map((pid) => (
                        <PlatformIcon key={pid} platform={pid} size={14} />
                      ))}
                    </div>
                    <StatusLabel status={post.status} />
                    <button
                      type="button"
                      onClick={() => onOpenComposer(post)}
                      className="px-2.5 py-1 text-xs font-medium border theme-surface-soft text-slate-700 dark:text-slate-200 hover:brightness-105 brand-radius cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
