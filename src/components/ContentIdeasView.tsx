import React, { useMemo, useState } from 'react';
import type { ContentIdeaBatch, ContentIdeaItem, PlatformId, Project } from '../types/workspace';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';

interface ContentIdeasViewProps {
  project: Project;
  onGenerateIdeas: (params: {
    industry: string;
    audienceInterests: string;
    platforms: PlatformId[];
  }) => Promise<ContentIdeaBatch>;
  onDraftFromIdea: (idea: ContentIdeaItem) => void;
}

export const ContentIdeasView: React.FC<ContentIdeasViewProps> = ({
  project,
  onGenerateIdeas,
  onDraftFromIdea,
}) => {
  const batches = project.ideaBatches ?? [];
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id ?? '');

  const [industry, setIndustry] = useState(project.industry);
  const [audienceInterests, setAudienceInterests] = useState(
    'Ingredient transparency, fast morning routines, dermatologist-backed demos'
  );
  const [platforms, setPlatforms] = useState<PlatformId[]>(['instagram', 'tiktok', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBatch = useMemo(() => {
    if (batches.length === 0) return null;
    return batches.find((b) => b.id === selectedBatchId) ?? batches[0];
  }, [batches, selectedBatchId]);

  const togglePlatform = (pid: PlatformId) => {
    setPlatforms((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!industry.trim()) {
      setError('Enter an industry or niche to generate content ideas.');
      return;
    }
    if (platforms.length === 0) {
      setError('Select at least one target platform.');
      return;
    }

    setLoading(true);
    try {
      const batch = await onGenerateIdeas({
        industry: industry.trim(),
        audienceInterests: audienceInterests.trim(),
        platforms,
      });
      setSelectedBatchId(batch.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate content ideas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            AI Content Idea Assistant
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate 5 trend-aligned social media concepts tailored to your industry, target audience interests, and channel formats.
          </p>
        </div>

        {batches.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="idea-batch-select"
              className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              Idea Batch
            </label>
            <select
              id="idea-batch-select"
              value={activeBatch?.id ?? ''}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 text-xs theme-input border text-slate-800 dark:text-slate-100 brand-radius"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.industry} · {new Date(b.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Prompt Configuration Form */}
      <form
        onSubmit={handleSubmit}
        className="theme-surface border brand-radius-lg p-5 space-y-4"
      >
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
              htmlFor="ideas-industry"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Industry or Niche
            </label>
            <input
              id="ideas-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Clean Beauty & Skincare, B2B Fintech, Specialty Coffee"
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>

          <div>
            <label
              htmlFor="ideas-interests"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Target Audience Interests & Current Trends
            </label>
            <input
              id="ideas-interests"
              type="text"
              value={audienceInterests}
              onChange={(e) => setAudienceInterests(e.target.value)}
              placeholder="e.g., Sustainability proofs, founder day-in-the-life, quick myth-busting"
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Target Platforms
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((pid) => {
              const active = platforms.includes(pid);
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => togglePlatform(pid)}
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {loading ? 'Brainstorming 5 Concepts...' : 'Generate 5 Content Ideas'}
          </button>
        </div>
      </form>

      {/* Generated Ideas Grid */}
      {!activeBatch ? (
        <div className="theme-surface border brand-radius-lg py-14 px-6 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Ready to brainstorm 5 fresh content angles
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
            Enter your niche and audience interests above to generate 5 channel-ready ideas with suggested formats and opening hooks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Niche: <strong className="text-slate-800 dark:text-slate-200">{activeBatch.industry}</strong> ·{' '}
              {activeBatch.ideas.length} creative concepts
            </span>
            <span>Audience focus: {activeBatch.audienceInterests}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {activeBatch.ideas.map((idea, index) => (
              <article
                key={idea.id}
                className={`theme-surface border brand-radius-lg p-5 flex flex-col justify-between space-y-4 ${
                  index === 4 && activeBatch.ideas.length === 5 ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        0{index + 1}.
                      </span>
                      <PlatformIcon platform={idea.platform} size={14} showLabel />
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {idea.format}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {idea.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {idea.description}
                  </p>

                  <div className="pt-3 border-t theme-divider space-y-1.5 text-xs">
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Trend angle:{' '}
                      </span>
                      {idea.trendAngle}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Opening hook:{' '}
                      </span>
                      “{idea.audienceHook}”
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onDraftFromIdea(idea)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Create Post from Idea
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
