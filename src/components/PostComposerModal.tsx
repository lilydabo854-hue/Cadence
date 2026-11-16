import React, { useMemo, useState } from 'react';
import type {
  BrandingConfig,
  ContentAsset,
  ContentFormat,
  HashtagSuggestion,
  PlatformId,
  PostStatus,
  Project,
  SocialPost,
} from '../types/workspace';
import {
  ALL_PLATFORMS,
  PLATFORM_SPECS,
  validatePostForPlatforms,
} from '../utils/scheduler';
import {
  getRecommendedHashtagCount,
  mergeHashtags,
  normalizeHashtag,
} from '../utils/intelligence';
import { PlatformIcon } from './PlatformIcon';
import { resolveMediaUrl } from '../assets/media';
import { Check, Hash, Sparkles, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface PostComposerModalProps {
  project: Project;
  assets: ContentAsset[];
  branding: BrandingConfig;
  initialPost?: SocialPost;
  prefillDateIso?: string;
  prefillDraft?: {
    title?: string;
    caption?: string;
    platforms?: PlatformId[];
    format?: ContentFormat;
  };
  onClose: () => void;
  onSavePost: (payload: Partial<SocialPost>, existingId?: string) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onAiGenerateCopy: (params: {
    platforms: PlatformId[];
    topic: string;
    tone: string;
    pillarId: string;
  }) => Promise<{ title: string; caption: string; hashtags: string[]; optimizationNote: string }>;
  onAiGenerateHashtags: (params: {
    platforms: PlatformId[];
    topic: string;
    caption: string;
    format: ContentFormat;
  }) => Promise<{ suggestions: HashtagSuggestion[]; strategyNote: string }>;
}

const FORMAT_OPTIONS: ContentFormat[] = [
  'Single Post',
  'Carousel',
  'Reel / Short',
  'Thread',
  'Video',
  'Pin',
  'Article',
];

export const PostComposerModal: React.FC<PostComposerModalProps> = ({
  project,
  assets,
  branding,
  initialPost,
  prefillDateIso,
  prefillDraft,
  onClose,
  onSavePost,
  onDeletePost,
  onAiGenerateCopy,
  onAiGenerateHashtags,
}) => {
  const [title, setTitle] = useState(initialPost?.title ?? prefillDraft?.title ?? '');
  const [caption, setCaption] = useState(initialPost?.caption ?? prefillDraft?.caption ?? '');
  const [hashtagsRaw, setHashtagsRaw] = useState(
    initialPost?.hashtags?.join(' ') ?? '#BrandStory #Launch'
  );
  const [platforms, setPlatforms] = useState<PlatformId[]>(
    initialPost?.platforms ?? prefillDraft?.platforms ?? ['linkedin', 'instagram']
  );
  const [format, setFormat] = useState<ContentFormat>(
    initialPost?.format ?? prefillDraft?.format ?? 'Single Post'
  );
  const [pillarId, setPillarId] = useState(
    initialPost?.pillarId || project.pillars[0]?.id || ''
  );
  const [scheduledLocal, setScheduledLocal] = useState(() => {
    const iso = initialPost?.scheduledAt || prefillDateIso || '2026-11-18T14:00:00.000Z';
    return iso.slice(0, 16);
  });
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialPost?.assetId ?? '');
  const [selectedMediaKey, setSelectedMediaKey] = useState<string>(initialPost?.mediaKey ?? '');
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>(
    initialPost?.platforms[0] ?? prefillDraft?.platforms?.[0] ?? 'instagram'
  );

  const [aiTopic, setAiTopic] = useState(prefillDraft?.title ?? '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [hashtagFocus, setHashtagFocus] = useState<PlatformId | 'selected'>('selected');
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [hashtagStrategyNote, setHashtagStrategyNote] = useState<string | null>(null);
  const [hashtagError, setHashtagError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedHashtags = useMemo(
    () =>
      hashtagsRaw
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`)),
    [hashtagsRaw]
  );

  const validation = useMemo(
    () =>
      validatePostForPlatforms(
        caption,
        parsedHashtags,
        platforms,
        Boolean(selectedMediaKey)
      ),
    [caption, parsedHashtags, platforms, selectedMediaKey]
  );

  const togglePlatform = (pid: PlatformId) => {
    setPlatforms((prev) => {
      const next = prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid];
      if (next.length > 0 && !next.includes(previewPlatform)) {
        setPreviewPlatform(next[0]);
      }
      return next;
    });
  };

  const handleSelectAsset = (asset: ContentAsset) => {
    setSelectedAssetId(asset.id);
    setSelectedMediaKey(asset.mediaKey ?? '');
  };

  const handleAiCopy = async () => {
    setSubmitError(null);
    const brief = aiTopic.trim() || title.trim();
    if (!brief) {
      setSubmitError('Enter a topic or post title before generating AI copy.');
      return;
    }
    setAiLoading(true);
    try {
      const pillar = project.pillars.find((p) => p.id === pillarId);
      const result = await onAiGenerateCopy({
        platforms,
        topic: brief,
        tone: pillar?.tone || 'Editorial, engaging',
        pillarId,
      });
      if (!title.trim()) setTitle(result.title);
      setCaption(result.caption);
      if (result.hashtags.length > 0) setHashtagsRaw(result.hashtags.join(' '));
      setAiNote(result.optimizationNote);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'AI copy generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const activeHashtagSet = useMemo(() => {
    return new Set(parsedHashtags.map((t) => normalizeHashtag(t).toLowerCase()).filter(Boolean));
  }, [parsedHashtags]);

  const handleGenerateHashtags = async () => {
    setHashtagError(null);
    const topicText = aiTopic.trim() || title.trim();
    const captionText = caption.trim();
    if (!topicText && !captionText) {
      setHashtagError('Enter a caption or post title first to generate relevant hashtags.');
      return;
    }

    const targetPlatforms: PlatformId[] =
      hashtagFocus === 'selected'
        ? platforms.length > 0
          ? platforms
          : ['instagram']
        : [hashtagFocus];

    setHashtagLoading(true);
    try {
      const result = await onAiGenerateHashtags({
        platforms: targetPlatforms,
        topic: topicText,
        caption: captionText,
        format,
      });
      setHashtagSuggestions(result.suggestions);
      setHashtagStrategyNote(result.strategyNote);
    } catch (err) {
      setHashtagError(err instanceof Error ? err.message : 'Hashtag generation failed.');
    } finally {
      setHashtagLoading(false);
    }
  };

  const handleToggleSuggestedHashtag = (rawTag: string) => {
    const normalized = normalizeHashtag(rawTag);
    if (!normalized) return;
    if (activeHashtagSet.has(normalized.toLowerCase())) {
      const next = hashtagsRaw
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t && normalizeHashtag(t).toLowerCase() !== normalized.toLowerCase());
      setHashtagsRaw(next.join(' '));
    } else {
      setHashtagsRaw((prev) => mergeHashtags(prev, [normalized]));
    }
  };

  const handleAddAllSuggestedHashtags = () => {
    const tags = hashtagSuggestions.map((s) => s.tag);
    setHashtagsRaw((prev) => mergeHashtags(prev, tags));
  };

  const handleAction = async (targetStatus: PostStatus) => {
    setSubmitError(null);
    if (!title.trim()) {
      setSubmitError('Post title is required.');
      return;
    }
    if (!validation.valid) {
      setSubmitError(validation.errors[0]);
      return;
    }
    setSaving(true);
    try {
      const isoSchedule = new Date(scheduledLocal).toISOString();
      await onSavePost(
        {
          projectId: project.id,
          title: title.trim(),
          caption: caption.trim(),
          hashtags: parsedHashtags,
          platforms,
          format,
          pillarId,
          status: targetStatus,
          scheduledAt: isoSchedule,
          assetId: selectedAssetId || undefined,
          mediaKey: selectedMediaKey || undefined,
        },
        initialPost?.id
      );
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save post.');
    } finally {
      setSaving(false);
    }
  };

  const previewImgUrl = resolveMediaUrl(selectedMediaKey);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-heading"
    >
      <div className="w-full max-w-5xl theme-surface-strong border brand-radius-lg shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b theme-divider">
          <div>
            <h2 id="composer-heading" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {initialPost ? 'Edit Social Post' : 'Create Cross-Platform Post'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {project.name} · {platforms.length} channel{platforms.length === 1 ? '' : 's'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close composer"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 brand-radius cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[78vh] overflow-y-auto lg:max-h-none lg:overflow-visible">
          {/* Left Form */}
          <div className="lg:col-span-7 p-6 space-y-5 border-b lg:border-b-0 lg:border-r theme-divider lg:max-h-[76vh] lg:overflow-y-auto">
            {submitError && (
              <div
                className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 brand-radius"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {/* Target Platforms */}
            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Channels
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="post-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Campaign / Post Title
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Q4 Botanical Serum Launch"
                  className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                />
              </div>

              <div>
                <label htmlFor="post-format" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Content Format
                </label>
                <select
                  id="post-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ContentFormat)}
                  className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                >
                  {FORMAT_OPTIONS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Copy Generator Strip */}
            <div className="p-3.5 theme-surface-soft border brand-radius space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="ai-topic-input" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  AI Copy Assistant (Gemini)
                </label>
                {aiNote && (
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {aiNote}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  id="ai-topic-input"
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Describe the angle, offer, or key metric to highlight..."
                  className="flex-1 px-3 py-1.5 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                />
                <button
                  type="button"
                  onClick={handleAiCopy}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  {aiLoading ? 'Writing...' : 'Generate Copy'}
                </button>
              </div>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="post-caption" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Post Caption
                </label>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {caption.length} chars
                  {platforms.includes('x') && ' · X max 280'}
                </span>
              </div>
              <textarea
                id="post-caption"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write high-retention copy tailored for your selected social platforms..."
                className="w-full px-3 py-2 text-sm theme-input border text-slate-900 dark:text-slate-100 brand-radius"
              />
              {validation.warnings.length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {validation.warnings[0]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label htmlFor="post-hashtags" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hashtags
                </label>
                <input
                  id="post-hashtags"
                  type="text"
                  value={hashtagsRaw}
                  onChange={(e) => setHashtagsRaw(e.target.value)}
                  className="w-full px-3 py-2 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                />
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="post-pillar" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Strategy Pillar
                </label>
                <select
                  id="post-pillar"
                  value={pillarId}
                  onChange={(e) => setPillarId(e.target.value)}
                  className="w-full px-3 py-2 text-xs theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                >
                  {project.pillars.map((pil) => (
                    <option key={pil.id} value={pil.id}>
                      {pil.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-4">
                <label htmlFor="post-schedule" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Schedule Date & Time
                </label>
                <input
                  id="post-schedule"
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => setScheduledLocal(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono theme-input border text-slate-900 dark:text-slate-100 brand-radius"
                />
              </div>
            </div>

            {/* AI Hashtag Generator */}
            <div className="pt-4 border-t theme-divider space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    AI Hashtag Generator
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {getRecommendedHashtagCount(
                      hashtagFocus === 'selected' ? previewPlatform : hashtagFocus
                    ).note}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label htmlFor="hashtag-target-platform" className="sr-only">
                    Hashtag target platform
                  </label>
                  <select
                    id="hashtag-target-platform"
                    value={hashtagFocus}
                    onChange={(e) =>
                      setHashtagFocus(e.target.value as PlatformId | 'selected')
                    }
                    className="px-2.5 py-1.5 text-xs theme-input border text-slate-800 dark:text-slate-100 brand-radius"
                  >
                    <option value="selected">
                      All Selected ({platforms.length || 1})
                    </option>
                    {(platforms.length > 0 ? platforms : ALL_PLATFORMS).map((pid) => (
                      <option key={pid} value={pid}>
                        {PLATFORM_SPECS[pid].label} Only
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateHashtags}
                    disabled={hashtagLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                    {hashtagLoading ? 'Generating...' : 'Suggest Hashtags'}
                  </button>
                </div>
              </div>

              {hashtagError && (
                <div
                  role="alert"
                  className="p-2.5 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 brand-radius"
                >
                  {hashtagError}
                </div>
              )}

              {hashtagSuggestions.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {hashtagStrategyNote &&
                      hashtagStrategyNote !==
                        getRecommendedHashtagCount(
                          hashtagFocus === 'selected' ? previewPlatform : hashtagFocus
                        ).note
                        ? hashtagStrategyNote
                        : 'Select tags below to toggle them in your post and live preview.'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleAddAllSuggestedHashtags}
                        className="text-xs font-medium brand-accent-text hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Add All ({hashtagSuggestions.length})
                      </button>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                        ·
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setHashtagSuggestions([]);
                          setHashtagStrategyNote(null);
                        }}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hashtagSuggestions.map((item) => {
                      const active = activeHashtagSet.has(item.tag.toLowerCase());
                      return (
                        <button
                          key={item.tag}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleToggleSuggestedHashtag(item.tag)}
                          className={`p-2.5 text-left border brand-radius transition-colors cursor-pointer space-y-1 ${
                            active
                              ? 'brand-accent-soft-bg brand-accent-border'
                              : 'theme-input hover:opacity-90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold font-mono text-slate-900 dark:text-slate-100 truncate">
                              {item.tag}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0 ${
                                active
                                  ? 'brand-accent-text'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {active && <Check className="w-3 h-3" aria-hidden="true" />}
                              {active ? 'Added' : '+ Add'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.category} · {item.reachTier} · {PLATFORM_SPECS[item.targetPlatform]?.label ?? item.targetPlatform}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                            {item.rationale}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Project Content Bank Picker */}
            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Attach Media from {project.name} Content Bank
              </span>
              {assets.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No assets in this project's Content Bank yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {assets.map((asset) => {
                    const url = resolveMediaUrl(asset.mediaKey);
                    const selected = selectedAssetId === asset.id || selectedMediaKey === asset.mediaKey;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSelectAsset(asset)}
                        className={`p-1.5 border text-left brand-radius transition-colors cursor-pointer ${
                          selected
                            ? 'brand-accent-border brand-accent-soft-bg'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={asset.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-16 object-cover brand-radius"
                          />
                        ) : (
                          <div className="w-full h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center brand-radius">
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
                          {asset.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Native Channel Preview */}
          <div className="lg:col-span-5 p-6 theme-surface-soft flex flex-col justify-between space-y-4 lg:max-h-[76vh] lg:overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Live Channel Preview
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {(platforms.length > 0 ? platforms : (['instagram'] as PlatformId[])).map((pid) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setPreviewPlatform(pid)}
                      className={`px-2 py-1 text-xs brand-radius cursor-pointer ${
                        previewPlatform === pid
                          ? 'theme-surface-strong border text-slate-900 dark:text-slate-50'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <PlatformIcon platform={pid} size={13} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Card */}
              <div className="theme-surface border brand-radius-lg overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b theme-divider">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {project.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {project.handle} · {PLATFORM_SPECS[previewPlatform]?.label} · {format}
                    </p>
                  </div>
                  <PlatformIcon platform={previewPlatform} size={16} />
                </div>

                {previewImgUrl ? (
                  <div className="relative theme-surface-soft">
                    <img
                      src={previewImgUrl}
                      alt={title || 'Post visual preview'}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-60 object-cover"
                    />
                    {branding.showWatermarkInPreviews && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-slate-950/75 text-white brand-radius">
                        {branding.workspaceName}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-36 theme-surface-soft border-b theme-divider flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    Select an asset from Content Bank to preview visual framing
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {caption || 'Your post caption preview will appear here...'}
                  </p>
                  {parsedHashtags.length > 0 && (
                    <p className="text-xs brand-accent-text">
                      {parsedHashtags.join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t theme-divider pt-3">
              Max length on {PLATFORM_SPECS[previewPlatform]?.label}:{' '}
              <span className="font-mono">{PLATFORM_SPECS[previewPlatform]?.maxChars} chars</span> · Recommended aspect:{' '}
              <span className="font-mono">{PLATFORM_SPECS[previewPlatform]?.aspectHint}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t theme-divider theme-surface-soft flex flex-wrap items-center justify-between gap-3">
          <div>
            {initialPost && (
              <button
                type="button"
                onClick={async () => {
                  await onDeletePost(initialPost.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 brand-radius cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Delete Post
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 brand-radius cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAction('Draft')}
              className="px-3.5 py-2 text-xs font-medium border theme-input text-slate-800 dark:text-slate-100 hover:opacity-90 brand-radius cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAction('In Review')}
              className="px-3.5 py-2 text-xs font-medium border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 brand-radius cursor-pointer"
            >
              Submit for Approval
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleAction('Scheduled')}
              className="px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Schedule Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
