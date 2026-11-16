import React, { useState } from 'react';
import type { Project, SocialPost } from '../types/workspace';
import { ALL_PLATFORMS, PLATFORM_SPECS } from '../utils/scheduler';
import { PlatformIcon } from './PlatformIcon';
import { Plus, Sparkles } from 'lucide-react';

interface StrategyViewProps {
  project: Project;
  posts: SocialPost[];
  onAddPillar: (payload: {
    name: string;
    description: string;
    targetSharePct: number;
    tone: string;
    audience: string;
  }) => Promise<void>;
  onGenerateAiPillar: (goal: string) => Promise<void>;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  project,
  posts,
  onAddPillar,
  onGenerateAiPillar,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetSharePct, setTargetSharePct] = useState(25);
  const [tone, setTone] = useState('Editorial, evidence-led');
  const [audience, setAudience] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !description.trim()) {
      setFormError('Please provide both a pillar name and strategic description.');
      return;
    }
    await onAddPillar({
      name: name.trim(),
      description: description.trim(),
      targetSharePct,
      tone: tone.trim(),
      audience: audience.trim() || 'Core audience',
    });
    setName('');
    setDescription('');
    setAudience('');
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    if (!aiGoal.trim()) {
      setAiError('Enter a campaign objective first.');
      return;
    }
    setAiLoading(true);
    try {
      await onGenerateAiPillar(aiGoal.trim());
      setAiGoal('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate strategy pillar.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b theme-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Content Strategy & Pillars
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Define editorial pillars, voice guidelines, and weekly cadence targets across all 7 networks for {project.name}.
          </p>
        </div>
      </div>

      {/* Content Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.pillars.map((pillar) => {
          const pillarPosts = posts.filter((p) => p.pillarId === pillar.id).length;
          const actualShare = posts.length > 0 ? Math.round((pillarPosts / posts.length) * 100) : 0;

          return (
            <article
              key={pillar.id}
              className="theme-surface border brand-radius-lg p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums">Target {pillar.targetSharePct}%</span>
                  <span className="font-mono tabular-nums">{pillarPosts} posts ({actualShare}%)</span>
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mt-2">
                  {pillar.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t theme-divider space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Tone:</span> {pillar.tone}
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Audience:</span> {pillar.audience}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Add Pillar & AI Strategy Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmit}
          className="theme-surface border brand-radius-lg p-5 space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Add Content Pillar
          </h2>
          {formError && (
            <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="pillar-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pillar Name
              </label>
              <input
                id="pillar-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Proof & Case Studies"
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
            <div>
              <label htmlFor="pillar-share" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mix Target (%)
              </label>
              <input
                id="pillar-share"
                type="number"
                min={5}
                max={100}
                value={targetSharePct}
                onChange={(e) => setTargetSharePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono theme-input border text-slate-900 dark:text-slate-100 brand-radius focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pillar-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Strategic Focus
            </label>
            <textarea
              id="pillar-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What formats, angles, and proof points belong here?"
              className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pillar-tone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Voice & Tone
              </label>
              <input
                id="pillar-tone"
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
            </div>
            <div>
              <label htmlFor="pillar-audience" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              <input
                id="pillar-audience"
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Retail buyers & repeat customers"
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Save Pillar
          </button>
        </form>

        <form
          onSubmit={handleAiGenerate}
          className="theme-surface border brand-radius-lg p-5 flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              AI Strategy Architect
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Describe an upcoming launch, seasonal objective, or audience segment you want to grow. Gemini analyzes your current pillars and proposes a differentiated new content pillar.
            </p>
            {aiError && (
              <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
                {aiError}
              </p>
            )}
            <div>
              <label htmlFor="ai-strategy-goal" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Campaign Objective
              </label>
              <textarea
                id="ai-strategy-goal"
                rows={3}
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g., Increase high-intent YouTube and Pinterest discovery traffic ahead of our holiday gift set drop."
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius transition-colors cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {aiLoading ? 'Synthesizing Strategy...' : 'Generate Strategic Pillar'}
            </button>
          </div>
        </form>
      </div>

      {/* 7-Platform Channel Cadence Matrix */}
      <section className="theme-surface border brand-radius-lg p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Channel Cadence & Format Specs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b theme-divider text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-4">Platform</th>
                <th className="py-2.5 px-4">Primary Formats</th>
                <th className="py-2.5 px-4">Aspect Ratio</th>
                <th className="py-2.5 px-4 text-right">Weekly Target</th>
                <th className="py-2.5 pl-4 text-right">Queued / Published</th>
              </tr>
            </thead>
            <tbody className="divide-y theme-divider text-sm">
              {ALL_PLATFORMS.map((pid) => {
                const spec = PLATFORM_SPECS[pid];
                const rule = project.autoScheduleRules.find((r) => r.platform === pid);
                const count = posts.filter((p) => p.platforms.includes(pid)).length;
                return (
                  <tr key={pid} className="hover:bg-white/40 dark:hover:bg-slate-800/35 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-slate-100">
                      <PlatformIcon platform={pid} size={15} showLabel />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {spec.defaultFormats.join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {spec.aspectHint}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {rule?.weeklyTarget ?? 3} / wk
                    </td>
                    <td className="py-3 pl-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {count} posts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
