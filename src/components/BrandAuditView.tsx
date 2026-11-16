import React, { useMemo, useState } from 'react';
import type {
  BrandAuditInput,
  BrandAuditReport,
  PlatformId,
  Project,
  SocialPost,
} from '../types/workspace';
import { validateBrandAuditInput } from '../utils/intelligence';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { ClipboardCheck, RefreshCw, Sparkles } from 'lucide-react';

interface BrandAuditViewProps {
  project: Project;
  posts: SocialPost[];
  onRunBrandAudit: (input: BrandAuditInput) => Promise<BrandAuditReport>;
}

export const BrandAuditView: React.FC<BrandAuditViewProps> = ({
  project,
  posts,
  onRunBrandAudit,
}) => {
  const audits = project.brandAudits ?? [];
  const [selectedAuditId, setSelectedAuditId] = useState<string>(audits[0]?.id ?? '');

  const [formState, setFormState] = useState<BrandAuditInput>({
    brandName: project.name,
    industry: project.industry,
    platforms:
      project.connectedPlatforms.length > 0
        ? project.connectedPlatforms
        : ['instagram', 'linkedin', 'tiktok'],
    followersTotal: project.followersTotal,
    postsPerMonth: Math.max(12, posts.length * 4),
    avgEngagementRate: 5.1,
    avgResponseHours: 6,
    bioClarityScore: 8,
    visualConsistencyScore: 8,
    contentMixSummary:
      'Ingredient breakdowns, dermatology myth-busting carousels, texture reels, and product routines.',
    voiceAndAudienceNotes:
      project.summary || 'Science-backed skincare brand communicating calmly with ingredient-conscious buyers.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAudit = useMemo(() => {
    if (audits.length === 0) return null;
    return audits.find((a) => a.id === selectedAuditId) ?? audits[0];
  }, [audits, selectedAuditId]);

  const handleTogglePlatform = (pid: PlatformId) => {
    setFormState((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(pid)
        ? prev.platforms.filter((p) => p !== pid)
        : [...prev.platforms, pid],
    }));
  };

  const handlePrefillFromProject = () => {
    const publishedWithMetrics = posts.filter((p) => p.status === 'Published' && p.metrics);
    const avgEr =
      publishedWithMetrics.length > 0
        ? Number(
            (
              publishedWithMetrics.reduce((acc, p) => acc + (p.metrics?.engagementRate ?? 0), 0) /
              publishedWithMetrics.length
            ).toFixed(2)
          )
        : 4.8;

    const pillarSummary =
      project.pillars.length > 0
        ? project.pillars.map((p) => `${p.name} (${p.targetSharePct}%)`).join(', ')
        : 'Educational storytelling, product highlights, and community engagement.';

    setFormState({
      brandName: project.name,
      industry: project.industry,
      platforms:
        project.connectedPlatforms.length > 0
          ? project.connectedPlatforms
          : ['instagram', 'linkedin'],
      followersTotal: project.followersTotal,
      postsPerMonth: Math.max(8, posts.length * 4),
      avgEngagementRate: avgEr,
      avgResponseHours: 4,
      bioClarityScore: 8,
      visualConsistencyScore: 8,
      contentMixSummary: pillarSummary,
      voiceAndAudienceNotes: project.summary || `${project.name} operating in ${project.industry}.`,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = validateBrandAuditInput(formState);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    setLoading(true);
    try {
      const report = await onRunBrandAudit(formState);
      setSelectedAuditId(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete brand audit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Brand Health Audit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Submit brand metrics, channel mix, and profile ratings for an AI score and prioritized social best practices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {audits.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="audit-history-select"
                className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
              >
                Saved Audit
              </label>
              <select
                id="audit-history-select"
                value={activeAudit?.id ?? ''}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="px-3 py-1.5 text-xs theme-input border text-slate-800 dark:text-slate-100 brand-radius"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.input.brandName} · Score {a.overallScore}/100 ·{' '}
                    {new Date(a.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrefillFromProject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Pre-fill from Project Data
          </button>
        </div>
      </div>

      {/* Audit Metrics Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="theme-surface border brand-radius-lg p-5 space-y-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Brand Metrics & Profile Assessment
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            All metrics analyzed together for calibrated scoring
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 brand-radius"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="audit-brand-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Brand Name
            </label>
            <input
              id="audit-brand-name"
              type="text"
              value={formState.brandName}
              onChange={(e) => setFormState((prev) => ({ ...prev, brandName: e.target.value }))}
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-industry"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Industry / Category
            </label>
            <input
              id="audit-industry"
              type="text"
              value={formState.industry}
              onChange={(e) => setFormState((prev) => ({ ...prev, industry: e.target.value }))}
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Active Social Platforms
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((pid) => {
              const active = formState.platforms.includes(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => handleTogglePlatform(pid)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border brand-radius transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'brand-accent-soft-bg brand-accent-border brand-accent-text'
                      : 'theme-input text-slate-700 dark:text-slate-300 hover:opacity-90'
                  }`}
                >
                  <PlatformIcon platform={pid} size={13} />
                  {PLATFORM_SPECS[pid].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="audit-followers"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Total Cross-Channel Followers
            </label>
            <input
              id="audit-followers"
              type="number"
              min={0}
              value={formState.followersTotal}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, followersTotal: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-posts-month"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Posts Published per Month
            </label>
            <input
              id="audit-posts-month"
              type="number"
              min={0}
              value={formState.postsPerMonth}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, postsPerMonth: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-er"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Avg Engagement Rate (%)
            </label>
            <input
              id="audit-er"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={formState.avgEngagementRate}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, avgEngagementRate: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-response-hours"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Avg Community Response Time (hrs)
            </label>
            <input
              id="audit-response-hours"
              type="number"
              step="0.5"
              min={0}
              value={formState.avgResponseHours}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, avgResponseHours: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-bio-clarity"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Bio & Link-in-Bio CTA Clarity (1–10)
            </label>
            <input
              id="audit-bio-clarity"
              type="number"
              min={1}
              max={10}
              value={formState.bioClarityScore}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, bioClarityScore: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-visual-consistency"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Visual Brand Consistency (1–10)
            </label>
            <input
              id="audit-visual-consistency"
              type="number"
              min={1}
              max={10}
              value={formState.visualConsistencyScore}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  visualConsistencyScore: Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono tabular-nums theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="audit-content-mix"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Current Content Mix & Format Breakdown
            </label>
            <textarea
              id="audit-content-mix"
              rows={3}
              value={formState.contentMixSummary}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, contentMixSummary: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="audit-voice-notes"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Brand Voice, Positioning & Audience Notes
            </label>
            <textarea
              id="audit-voice-notes"
              rows={3}
              value={formState.voiceAndAudienceNotes}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, voiceAndAudienceNotes: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>
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
              <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {loading ? 'Auditing Brand Profile...' : 'Run AI Brand Audit'}
          </button>
        </div>
      </form>

      {/* Audit Result Report */}
      {!activeAudit ? (
        <div className="theme-surface border brand-radius-lg py-14 px-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No brand audit scored yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Complete the assessment form above to receive an overall brand score, category sub-scores, and tailored best practices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scoreboard & Sub-Scores */}
          <section className="theme-surface border brand-radius-lg p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b theme-divider pb-6">
              <div className="space-y-2 max-w-2xl">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeAudit.input.brandName} · {activeAudit.input.industry} · Audited{' '}
                  {new Date(activeAudit.createdAt).toLocaleDateString()}
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Brand Audit Scorecard
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeAudit.verdict}
                </p>
              </div>

              <div className="shrink-0 text-left md:text-right">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Overall Brand Score
                </div>
                <div className="text-4xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-1">
                  {activeAudit.overallScore}
                  <span className="text-lg font-normal text-slate-400 dark:text-slate-500">
                    /100
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Cadence & Consistency', score: activeAudit.subScores.consistency },
                { label: 'Engagement Health', score: activeAudit.subScores.engagementHealth },
                { label: 'Profile Optimization', score: activeAudit.subScores.profileOptimization },
                { label: 'Content Mix Depth', score: activeAudit.subScores.contentMix },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                      {item.score}/100
                    </span>
                  </div>
                  <div className="h-2 w-full theme-surface-soft border rounded-full overflow-hidden">
                    <div
                      className="h-full brand-accent-bg rounded-full transition-all"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t theme-divider">
              <div>
                <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Verified Brand Strengths
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeAudit.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  Priority Gaps to Close
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeAudit.gaps.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Best Practices Table / Action Plan */}
          <section className="theme-surface border brand-radius-lg p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Recommended Best Practices
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ranked actions calibrated to improve score across weak dimensions
              </p>
            </div>

            <div className="divide-y theme-divider">
              {activeAudit.bestPractices.map((practice, idx) => (
                <div
                  key={idx}
                  className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {practice.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium ${
                          practice.priority === 'High'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {practice.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {practice.recommendation}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Expected outcome: {practice.expectedOutcome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
