import React, { useMemo, useState } from 'react';
import type { CompetitorAnalysisReport, Project } from '../types/workspace';
import { parseCompetitorProfileUrl } from '../utils/intelligence';
import { PlatformIcon } from './PlatformIcon';
import { ExternalLink, Globe, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

interface CompetitorsViewProps {
  project: Project;
  onRunCompetitorAnalysis: (urls: string[]) => Promise<CompetitorAnalysisReport>;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  project,
  onRunCompetitorAnalysis,
}) => {
  const reports = project.competitorReports ?? [];
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id ?? '');
  const [urlInputs, setUrlInputs] = useState<string[]>([
    'https://www.instagram.com/glossier',
    'https://www.tiktok.com/@youthtothepeople',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeReport = useMemo(() => {
    if (reports.length === 0) return null;
    return reports.find((r) => r.id === selectedReportId) ?? reports[0];
  }, [reports, selectedReportId]);

  const handleUpdateUrl = (idx: number, val: string) => {
    setUrlInputs((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const handleAddRow = () => {
    if (urlInputs.length >= 6) return;
    setUrlInputs((prev) => [...prev, '']);
  };

  const handleRemoveRow = (idx: number) => {
    if (urlInputs.length <= 1) return;
    setUrlInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nonEmpty = urlInputs.map((u) => u.trim()).filter(Boolean);
    if (nonEmpty.length === 0) {
      setError('Enter at least one competitor social media profile URL.');
      return;
    }

    const parsed = nonEmpty.map((u) => parseCompetitorProfileUrl(u));
    const invalid = parsed.find((p) => !p.valid);
    if (invalid) {
      setError(invalid.error || 'One or more profile URLs are invalid.');
      return;
    }

    setLoading(true);
    try {
      const report = await onRunCompetitorAnalysis(parsed.map((p) => p.normalizedUrl));
      setSelectedReportId(report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze competitor profiles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Competitor Intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Benchmark competitor social URLs across posting cadence, engagement rate, content themes, and exploitable whitespace for {project.name}.
          </p>
        </div>

        {reports.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="competitor-history-select"
              className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              Saved Report
            </label>
            <select
              id="competitor-history-select"
              value={activeReport?.id ?? ''}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="px-3 py-1.5 text-xs theme-input border text-slate-800 dark:text-slate-100 brand-radius"
            >
              {reports.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.competitors.map((c) => c.name).join(' vs ') || rep.urls[0]} ·{' '}
                  {new Date(rep.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="theme-surface border brand-radius-lg p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Competitor Social Profile URLs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add Instagram, TikTok, LinkedIn, X, YouTube, Facebook, or Pinterest profile URLs to compare against {project.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRow}
            disabled={urlInputs.length >= 6}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border theme-input text-slate-700 dark:text-slate-200 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add URL
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 brand-radius"
          >
            {error}
          </div>
        )}

        <div className="space-y-2.5">
          {urlInputs.map((url, idx) => {
            const preview = url.trim() ? parseCompetitorProfileUrl(url) : null;
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <label htmlFor={`competitor-url-${idx}`} className="sr-only">
                    Competitor profile URL {idx + 1}
                  </label>
                  <input
                    id={`competitor-url-${idx}`}
                    type="text"
                    value={url}
                    onChange={(e) => handleUpdateUrl(idx, e.target.value)}
                    placeholder="https://www.instagram.com/competitor"
                    className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                  />
                </div>
                {preview && preview.valid && (
                  <div className="hidden sm:flex items-center gap-1.5 w-36 px-2.5 py-2 text-xs text-slate-600 dark:text-slate-300 border theme-surface-soft brand-radius truncate">
                    {preview.platform === 'web' ? (
                      <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    ) : (
                      <PlatformIcon platform={preview.platform} size={13} />
                    )}
                    <span className="truncate">{preview.handle}</span>
                  </div>
                )}
                {urlInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    aria-label={`Remove competitor URL ${idx + 1}`}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border theme-input brand-radius cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {loading ? 'Analyzing Competitor Channels...' : 'Analyze Competitors'}
          </button>
        </div>
      </form>

      {/* Report Output */}
      {!activeReport ? (
        <div className="theme-surface border brand-radius-lg py-14 px-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No competitor benchmarks run yet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Enter one or more competitor social URLs above to audit recent posts, engagement rates, content themes, and posting cadence.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Competitor Benchmark Table / Cards */}
          <div
            className={`grid grid-cols-1 gap-5 ${
              activeReport.competitors.length > 1 ? 'lg:grid-cols-2' : ''
            }`}
          >
            {activeReport.competitors.map((comp, i) => (
              <article
                key={`${comp.url}-${i}`}
                className="theme-surface border brand-radius-lg p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {comp.platform === 'web' ? (
                        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <PlatformIcon platform={comp.platform} size={14} showLabel />
                      )}
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{comp.handle}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 mt-1">
                      {comp.name}
                    </h3>
                  </div>

                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${comp.name} profile`}
                    className="inline-flex items-center gap-1 text-xs font-medium brand-accent-text hover:underline whitespace-nowrap shrink-0"
                  >
                    Profile
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>

                {/* Key Numeric Benchmarks */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y theme-divider">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Engagement Rate</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                      {comp.avgEngagementRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Posting Cadence</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                      {comp.postsPerWeek}/wk
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Est. Audience</div>
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50 mt-0.5">
                      {comp.estimatedFollowers}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Recurring Content Themes
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">
                    {comp.contentThemes.join(' · ')}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Recent Post Observations
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-4">
                    {comp.recentPostHighlights.map((highlight, idx) => (
                      <li key={idx}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* Executive Summary & SWOT Synthesis */}
          <section className="theme-surface border brand-radius-lg p-6 space-y-5">
            <div className="border-b theme-divider pb-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Summary Report · Generated {new Date(activeReport.createdAt).toLocaleDateString()}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                Competitive Synthesis & Capitalization Plan
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
                {activeReport.executiveSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                  Competitor Strengths
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeReport.strengths.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  Competitor Weaknesses
                </h3>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {activeReport.weaknesses.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold brand-accent-text mb-2">
                  Areas to Capitalize On
                </h3>
                <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-100 list-disc pl-4">
                  {activeReport.opportunitiesToCapitalize.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {activeReport.groundingSources && activeReport.groundingSources.length > 0 && (
              <div className="pt-4 border-t theme-divider">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Referenced Web Sources
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {activeReport.groundingSources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="brand-accent-text hover:underline truncate max-w-xs"
                    >
                      {src.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
