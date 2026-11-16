import React, { useState } from 'react';
import type { AiInsight, Project, SocialPost } from '../types/workspace';
import { PlatformIcon } from './PlatformIcon';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

interface AiInsightsViewProps {
  project: Project;
  posts: SocialPost[];
  onGenerateInsights: () => Promise<void>;
  onDraftFromInsight: (insight: AiInsight) => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  project,
  posts,
  onGenerateInsights,
  onDraftFromInsight,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishedCount = posts.filter((p) => p.status === 'Published').length;

  const handleRunAnalysis = async () => {
    setError(null);
    setLoading(true);
    try {
      await onGenerateInsights();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to run Gemini optimization analysis.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            AI Performance & Optimization Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gemini evaluates {publishedCount} published posts for {project.name} to surface high-leverage format, hook, and timing recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          )}
          {loading ? 'Analyzing Campaign Data...' : 'Generate AI Insights'}
        </button>
      </div>

      {error && (
        <div
          className="p-4 text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 brand-radius"
          role="alert"
        >
          {error}
        </div>
      )}

      {project.insights.length === 0 ? (
        <div className="theme-surface border brand-radius-lg py-16 px-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Ready to optimize {project.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Run an AI diagnostic across your published post metrics to discover winning formats, optimal posting hours, and next post topics.
          </p>
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Generate AI Insights
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {project.insights.map((ins) => (
            <article
              key={ins.id}
              className="theme-surface border brand-radius-lg p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    {ins.platform === 'all' ? (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Cross-Platform
                      </span>
                    ) : (
                      <PlatformIcon platform={ins.platform} size={14} showLabel />
                    )}
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-medium ${
                        ins.impact === 'High'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {ins.impact} Impact
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Target: {ins.metricTarget}</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    +{ins.predictedLiftPct}% lift
                  </span>
                </div>

                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {ins.title}
                </h2>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ins.recommendation}
                </p>

                <div className="p-3.5 theme-surface-soft border brand-radius space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Recommended Next Post Brief · Optimal Window: {ins.bestWindow}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {ins.suggestedTopic}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onDraftFromInsight(ins)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius cursor-pointer"
                >
                  Apply to New Post
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
