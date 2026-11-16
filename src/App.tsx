import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AiInsight,
  AutoScheduleRule,
  BrandAuditInput,
  BrandAuditReport,
  BrandingConfig,
  CompetitorAnalysisReport,
  ContentFormat,
  ContentIdeaBatch,
  ContentIdeaItem,
  HashtagSuggestion,
  PerformanceForecastReport,
  PlatformId,
  PostStatus,
  SocialPost,
  WorkspaceState,
} from './types/workspace';
import { OverviewView } from './components/OverviewView';
import { StrategyView } from './components/StrategyView';
import { CalendarView } from './components/CalendarView';
import { ApprovalsView } from './components/ApprovalsView';
import { ContentBankView } from './components/ContentBankView';
import { AnalyticsView } from './components/AnalyticsView';
import { AiInsightsView } from './components/AiInsightsView';
import { CompetitorsView } from './components/CompetitorsView';
import { ContentIdeasView } from './components/ContentIdeasView';
import { ForecastingView } from './components/ForecastingView';
import { BrandAuditView } from './components/BrandAuditView';
import { BrandStudioView } from './components/BrandStudioView';
import { PostComposerModal } from './components/PostComposerModal';
import { resolveMediaUrl } from './assets/media';
import { normalizeBrandingConfig, resolveThemeCssVars } from './utils/themes';
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Moon,
  Palette,
  Plus,
  Radar,
  Sparkles,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';

type NavSection =
  | 'overview'
  | 'strategy'
  | 'calendar'
  | 'approvals'
  | 'content-bank'
  | 'analytics'
  | 'ai-insights'
  | 'competitors'
  | 'content-ideas'
  | 'forecasting'
  | 'brand-audit'
  | 'brand-studio';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'strategy', label: 'Strategy', icon: Compass },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'content-bank', label: 'Content Bank', icon: FolderKanban },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
  { id: 'competitors', label: 'Competitors', icon: Radar },
  { id: 'content-ideas', label: 'Content Ideas', icon: Lightbulb },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  { id: 'brand-audit', label: 'Brand Audit', icon: ClipboardCheck },
  { id: 'brand-studio', label: 'Brand Studio', icon: Palette },
];

function applyBrandingToDocument(branding: BrandingConfig) {
  const normalized = normalizeBrandingConfig(branding);
  const root = document.documentElement;
  if (normalized.themeMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.dataset.themePreset = normalized.themePreset;
  root.dataset.bgPattern = normalized.backgroundPattern;
  root.dataset.surfaceTranslucency = normalized.surfaceTranslucency;

  const vars = resolveThemeCssVars(normalized);
  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [composerState, setComposerState] = useState<{
    open: boolean;
    post?: SocialPost;
    prefillDateIso?: string;
    prefillDraft?: {
      title?: string;
      caption?: string;
      platforms?: PlatformId[];
      format?: ContentFormat;
    };
  }>({ open: false });

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjIndustry, setNewProjIndustry] = useState('');

  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const fetchWorkspace = useCallback(async () => {
    try {
      const resp = await fetch('/api/workspace');
      if (!resp.ok) throw new Error('Failed to load workspace');
      const data = (await resp.json()) as WorkspaceState;
      setWorkspace(data);
      applyBrandingToDocument(data.branding);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach workspace server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  const activeProject = useMemo(() => {
    if (!workspace) return null;
    return (
      workspace.projects.find((p) => p.id === workspace.activeProjectId) ??
      workspace.projects[0] ??
      null
    );
  }, [workspace]);

  const projectPosts = useMemo(() => {
    if (!workspace || !activeProject) return [];
    return workspace.posts.filter((p) => p.projectId === activeProject.id);
  }, [workspace, activeProject]);

  const projectAssets = useMemo(() => {
    if (!workspace || !activeProject) return [];
    return workspace.assets.filter((a) => a.projectId === activeProject.id);
  }, [workspace, activeProject]);

  const pendingApprovalsCount = useMemo(
    () =>
      projectPosts.filter(
        (p) => p.status === 'In Review' || p.status === 'Changes Requested'
      ).length,
    [projectPosts]
  );

  const handleSwitchProject = async (projectId: string) => {
    const resp = await fetch('/api/workspace/active-project', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    if (resp.ok) {
      const next = (await resp.json()) as WorkspaceState;
      setWorkspace(next);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjIndustry.trim()) return;
    const resp = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProjName.trim(),
        industry: newProjIndustry.trim(),
      }),
    });
    if (resp.ok) {
      const next = (await resp.json()) as WorkspaceState;
      setWorkspace(next);
      setNewProjName('');
      setNewProjIndustry('');
      setShowNewProject(false);
      showToast('Project created and activated.');
    }
  };

  const handleUpdateBranding = async (patch: Partial<BrandingConfig>) => {
    if (!workspace) return;
    const optimistic = { ...workspace.branding, ...patch };
    applyBrandingToDocument(optimistic);
    setWorkspace({ ...workspace, branding: optimistic });

    const resp = await fetch('/api/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (resp.ok) {
      const next = (await resp.json()) as WorkspaceState;
      setWorkspace(next);
      applyBrandingToDocument(next.branding);
    }
  };

  const handleAutoFillSchedule = async (includeDrafts = true) => {
    if (!activeProject) return;
    setIsAutoScheduling(true);
    try {
      const resp = await fetch('/api/schedule/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id, includeDrafts }),
      });
      const data = (await resp.json()) as {
        state: WorkspaceState;
        scheduledCount: number;
      };
      if (resp.ok) {
        setWorkspace(data.state);
        showToast(
          data.scheduledCount > 0
            ? `Auto-scheduled ${data.scheduledCount} post${data.scheduledCount === 1 ? '' : 's'} into optimal channel slots.`
            : 'All approved posts are already scheduled.'
        );
      }
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleUpdateScheduleRules = async (
    enabled: boolean,
    rules: AutoScheduleRule[]
  ) => {
    if (!activeProject) return;
    const resp = await fetch(`/api/projects/${activeProject.id}/schedule-rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoScheduleEnabled: enabled, rules }),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast('Queue rules updated.');
    }
  };

  const handleSavePost = async (payload: Partial<SocialPost>, existingId?: string) => {
    if (existingId) {
      const resp = await fetch(`/api/posts/${existingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errData = (await resp.json()) as { error?: string };
        throw new Error(errData.error || 'Failed to update post');
      }
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast('Post updated.');
      return;
    }

    const resp = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errData = (await resp.json()) as { error?: string };
      throw new Error(errData.error || 'Failed to create post');
    }
    const data = (await resp.json()) as { state: WorkspaceState };
    setWorkspace(data.state);
    showToast(`Post saved as ${payload.status ?? 'Draft'}.`);
  };

  const handleDeletePost = async (id: string) => {
    const resp = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast('Post removed.');
    }
  };

  const handleTransitionStatus = async (
    postId: string,
    status: PostStatus,
    commentBody?: string
  ) => {
    const resp = await fetch(`/api/posts/${postId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        commentBody,
        authorName: 'Maya Lin',
        authorRole: 'Brand Lead',
      }),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast(`Post moved to ${status}.`);
    }
  };

  const handleAddComment = async (postId: string, body: string) => {
    const resp = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: 'Maya Lin',
        authorRole: 'Brand Lead',
        body,
      }),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
    }
  };

  const handleAddPillar = async (payload: {
    name: string;
    description: string;
    targetSharePct: number;
    tone: string;
    audience: string;
  }) => {
    if (!activeProject) return;
    const resp = await fetch(`/api/projects/${activeProject.id}/pillars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast('Content pillar added.');
    }
  };

  const handleGenerateAiPillar = async (goal: string) => {
    if (!activeProject) return;
    const resp = await fetch('/api/ai/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, goal }),
    });
    const data = (await resp.json()) as { state?: WorkspaceState; error?: string };
    if (!resp.ok) {
      throw new Error(data.error || 'Strategy generation failed');
    }
    if (data.state) {
      setWorkspace(data.state);
      showToast('AI generated new content pillar.');
    }
  };

  const handleAiGenerateCopy = async (params: {
    platforms: PlatformId[];
    topic: string;
    tone: string;
    pillarId: string;
  }) => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, ...params }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'AI copy generation failed');
    }
    return data;
  };

  const handleAiGenerateHashtags = async (params: {
    platforms: PlatformId[];
    topic: string;
    caption: string;
    format: ContentFormat;
  }): Promise<{ suggestions: HashtagSuggestion[]; strategyNote: string }> => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/hashtags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, ...params }),
    });
    const data = (await resp.json()) as {
      suggestions?: HashtagSuggestion[];
      strategyNote?: string;
      error?: string;
    };
    if (!resp.ok || !Array.isArray(data.suggestions)) {
      throw new Error(data.error || 'AI hashtag generation failed.');
    }
    return {
      suggestions: data.suggestions,
      strategyNote: data.strategyNote || '',
    };
  };

  const handleGenerateAiInsights = async () => {
    if (!activeProject) return;
    const resp = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id }),
    });
    const data = (await resp.json()) as { state?: WorkspaceState; error?: string };
    if (!resp.ok) {
      throw new Error(data.error || 'Failed to generate AI insights');
    }
    if (data.state) {
      setWorkspace(data.state);
      showToast('Updated AI optimization insights.');
    }
  };

  const handleAddAsset = async (payload: {
    title: string;
    type: 'image' | 'video' | 'template' | 'copy';
    mediaKey: string;
    dimensions: string;
    platforms: PlatformId[];
    tags: string[];
  }) => {
    if (!activeProject) return;
    const resp = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, ...payload }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as { state: WorkspaceState };
      setWorkspace(data.state);
      showToast('Asset added to Content Bank.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const resp = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
      showToast('Asset removed.');
    }
  };

  const handleConnectCanva = async () => {
    const resp = await fetch('/api/canva/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: true }),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
    }
  };

  const handleImportCanvaDesign = async (designId: string) => {
    if (!activeProject) return;
    const resp = await fetch('/api/canva/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, designId }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as { state: WorkspaceState };
      setWorkspace(data.state);
      showToast('Canva design imported into Content Bank.');
    }
  };

  const handleUpdateConnectedPlatforms = async (connectedPlatforms: PlatformId[]) => {
    if (!activeProject) return;
    const resp = await fetch(`/api/projects/${activeProject.id}/platforms`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectedPlatforms }),
    });
    if (resp.ok) {
      setWorkspace((await resp.json()) as WorkspaceState);
    }
  };

  const handleDraftFromInsight = (insight: AiInsight) => {
    if (!activeProject) return;
    setComposerState({
      open: true,
      post: undefined,
      prefillDateIso: '2026-11-21T14:00:00.000Z',
      prefillDraft: {
        title: insight.suggestedTopic,
        platforms:
          insight.platform === 'all' ? ['linkedin', 'instagram'] : [insight.platform],
        format:
          insight.platform === 'tiktok' || insight.platform === 'youtube'
            ? 'Reel / Short'
            : 'Carousel',
      },
    });
  };

  const handleRunCompetitorAnalysis = async (
    urls: string[]
  ): Promise<CompetitorAnalysisReport> => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/competitor-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, urls }),
    });
    const data = (await resp.json()) as {
      report?: CompetitorAnalysisReport;
      state?: WorkspaceState;
      error?: string;
    };
    if (!resp.ok || !data.report) {
      throw new Error(data.error || 'Competitor analysis failed.');
    }
    if (data.state) {
      setWorkspace(data.state);
    }
    showToast('Competitor analysis report generated.');
    return data.report;
  };

  const handleGenerateContentIdeas = async (params: {
    industry: string;
    audienceInterests: string;
    platforms: PlatformId[];
  }): Promise<ContentIdeaBatch> => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/content-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, ...params }),
    });
    const data = (await resp.json()) as {
      batch?: ContentIdeaBatch;
      state?: WorkspaceState;
      error?: string;
    };
    if (!resp.ok || !data.batch) {
      throw new Error(data.error || 'Failed to generate content ideas.');
    }
    if (data.state) {
      setWorkspace(data.state);
    }
    showToast('Generated 5 new creative content ideas.');
    return data.batch;
  };

  const handleDraftFromIdea = (idea: ContentIdeaItem) => {
    const normalized = idea.format.toLowerCase();
    let format: ContentFormat = 'Single Post';
    if (normalized.includes('carousel')) format = 'Carousel';
    else if (normalized.includes('reel') || normalized.includes('short')) format = 'Reel / Short';
    else if (normalized.includes('video')) format = 'Video';
    else if (normalized.includes('thread')) format = 'Thread';
    else if (normalized.includes('pin') || normalized.includes('infographic')) format = 'Pin';
    else if (normalized.includes('article')) format = 'Article';

    setComposerState({
      open: true,
      post: undefined,
      prefillDateIso: '2026-11-22T15:00:00.000Z',
      prefillDraft: {
        title: idea.title,
        caption: `${idea.audienceHook}\n\n${idea.description}`,
        platforms: [idea.platform],
        format,
      },
    });
  };

  const handleRunForecast = async (params: {
    platform: PlatformId;
    format: ContentFormat;
    contentDescription: string;
  }): Promise<PerformanceForecastReport> => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, ...params }),
    });
    const data = (await resp.json()) as {
      forecast?: PerformanceForecastReport;
      state?: WorkspaceState;
      error?: string;
    };
    if (!resp.ok || !data.forecast) {
      throw new Error(data.error || 'Performance forecasting failed.');
    }
    if (data.state) {
      setWorkspace(data.state);
    }
    showToast('Performance forecast ready for export.');
    return data.forecast;
  };

  const handleRunBrandAudit = async (input: BrandAuditInput): Promise<BrandAuditReport> => {
    if (!activeProject) {
      throw new Error('No active project');
    }
    const resp = await fetch('/api/ai/brand-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: activeProject.id, input }),
    });
    const data = (await resp.json()) as {
      audit?: BrandAuditReport;
      state?: WorkspaceState;
      error?: string;
    };
    if (!resp.ok || !data.audit) {
      throw new Error(data.error || 'Brand audit failed.');
    }
    if (data.state) {
      setWorkspace(data.state);
    }
    showToast('Brand audit scorecard updated.');
    return data.audit;
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-canvas flex items-center justify-center p-6">
        <div className="px-5 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium theme-surface border brand-radius-lg">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (error || !workspace || !activeProject) {
    return (
      <div className="min-h-screen theme-canvas flex items-center justify-center p-6">
        <div className="max-w-md w-full theme-surface-strong border p-6 brand-radius-lg text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Unable to load workspace
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error || 'Unknown error'}
          </p>
          <button
            type="button"
            onClick={fetchWorkspace}
            className="px-4 py-2 text-xs font-medium text-white brand-accent-bg brand-radius cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeNav)!;
  const avatarUrl = resolveMediaUrl('avatar_team_lead');

  return (
    <div className="min-h-screen theme-canvas text-slate-900 dark:text-slate-100 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 theme-surface-strong border-r flex flex-col justify-between transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Custom Workspace Wordmark */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="min-w-0">
              <div className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">
                {workspace.branding.workspaceName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {workspace.branding.workspaceTagline}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Project Switcher */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="project-switcher"
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                Active Project
              </label>
              <button
                type="button"
                onClick={() => setShowNewProject((v) => !v)}
                className="text-[11px] font-medium brand-accent-text hover:underline cursor-pointer"
              >
                + New Project
              </button>
            </div>
            <select
              id="project-switcher"
              value={activeProject.id}
              onChange={(e) => handleSwitchProject(e.target.value)}
              className="w-full px-2.5 py-2 text-xs font-medium theme-input border text-slate-900 dark:text-slate-100 brand-radius"
            >
              {workspace.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {showNewProject && (
              <form
                onSubmit={handleCreateProject}
                className="p-2.5 theme-surface-soft border brand-radius space-y-2"
              >
                <input
                  type="text"
                  aria-label="New project name"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Brand / Client name"
                  className="w-full px-2 py-1.5 text-xs theme-input border brand-radius"
                />
                <input
                  type="text"
                  aria-label="New project industry"
                  value={newProjIndustry}
                  onChange={(e) => setNewProjIndustry(e.target.value)}
                  placeholder="Industry (e.g., SaaS, Fashion)"
                  className="w-full px-2 py-1.5 text-xs theme-input border brand-radius"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="px-2 py-1 text-[11px] text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-medium text-white brand-accent-bg brand-radius cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Primary Workspace Navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium brand-radius transition-colors cursor-pointer ${
                    active
                      ? 'brand-accent-soft-bg brand-accent-text'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </span>
                  {item.id === 'approvals' && pendingApprovalsCount > 0 && (
                    <span className="text-xs font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Team Member Footer */}
        <div className="p-4 border-t theme-divider flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Maya Lin"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0 border theme-divider"
            />
          ) : (
            <div className="w-8 h-8 rounded-full theme-surface-soft shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              Maya Lin
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Creative Lead · Approver
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on Left, Theme + Create CTA on Right */}
        <header className="h-14 theme-surface-strong border-b px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 brand-radius"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 truncate">
              <span className="text-slate-600 dark:text-slate-400 truncate">
                {activeProject.name}
              </span>
              <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {activeNavMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              aria-label={
                workspace.branding.themeMode === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
              onClick={() =>
                handleUpdateBranding({
                  themeMode: workspace.branding.themeMode === 'dark' ? 'light' : 'dark',
                })
              }
              className="p-2 text-slate-700 dark:text-slate-200 theme-surface-soft border hover:bg-white/60 dark:hover:bg-white/10 brand-radius cursor-pointer"
            >
              {workspace.branding.themeMode === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setComposerState({ open: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white brand-accent-bg brand-radius whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create Post
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {toastMsg && (
            <div
              role="status"
              className="mb-4 px-4 py-2.5 text-xs font-medium theme-surface-strong border text-slate-900 dark:text-slate-100 brand-radius flex items-center justify-between"
            >
              <span>{toastMsg}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToastMsg(null)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-4"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeNav === 'overview' && (
            <OverviewView
              project={activeProject}
              posts={projectPosts}
              branding={workspace.branding}
              onNavigate={(view) => setActiveNav(view)}
              onOpenComposer={(post) => setComposerState({ open: true, post })}
              onAutoFillSchedule={() => handleAutoFillSchedule(true)}
              isAutoScheduling={isAutoScheduling}
            />
          )}

          {activeNav === 'strategy' && (
            <StrategyView
              project={activeProject}
              posts={projectPosts}
              onAddPillar={handleAddPillar}
              onGenerateAiPillar={handleGenerateAiPillar}
            />
          )}

          {activeNav === 'calendar' && (
            <CalendarView
              project={activeProject}
              posts={projectPosts}
              onOpenComposer={(post, prefillDateIso) =>
                setComposerState({ open: true, post, prefillDateIso })
              }
              onAutoFillSchedule={handleAutoFillSchedule}
              onUpdateScheduleRules={handleUpdateScheduleRules}
              isAutoScheduling={isAutoScheduling}
            />
          )}

          {activeNav === 'approvals' && (
            <ApprovalsView
              project={activeProject}
              posts={projectPosts}
              onTransitionStatus={handleTransitionStatus}
              onAddComment={handleAddComment}
            />
          )}

          {activeNav === 'content-bank' && (
            <ContentBankView
              project={activeProject}
              assets={projectAssets}
              canva={workspace.canva}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
              onConnectCanva={handleConnectCanva}
              onImportCanvaDesign={handleImportCanvaDesign}
              onRefreshWorkspace={fetchWorkspace}
            />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsView
              project={activeProject}
              posts={projectPosts}
              branding={workspace.branding}
              onNavigateAiInsights={() => setActiveNav('ai-insights')}
            />
          )}

          {activeNav === 'ai-insights' && (
            <AiInsightsView
              project={activeProject}
              posts={projectPosts}
              onGenerateInsights={handleGenerateAiInsights}
              onDraftFromInsight={handleDraftFromInsight}
            />
          )}

          {activeNav === 'competitors' && (
            <CompetitorsView
              key={activeProject.id}
              project={activeProject}
              onRunCompetitorAnalysis={handleRunCompetitorAnalysis}
            />
          )}

          {activeNav === 'content-ideas' && (
            <ContentIdeasView
              key={activeProject.id}
              project={activeProject}
              onGenerateIdeas={handleGenerateContentIdeas}
              onDraftFromIdea={handleDraftFromIdea}
            />
          )}

          {activeNav === 'forecasting' && (
            <ForecastingView
              key={activeProject.id}
              project={activeProject}
              posts={projectPosts}
              onRunForecast={handleRunForecast}
              onNotify={showToast}
            />
          )}

          {activeNav === 'brand-audit' && (
            <BrandAuditView
              key={activeProject.id}
              project={activeProject}
              posts={projectPosts}
              onRunBrandAudit={handleRunBrandAudit}
            />
          )}

          {activeNav === 'brand-studio' && (
            <BrandStudioView
              branding={workspace.branding}
              project={activeProject}
              onUpdateBranding={handleUpdateBranding}
              onUpdateConnectedPlatforms={handleUpdateConnectedPlatforms}
            />
          )}
        </main>
      </div>

      {/* Post Composer Modal */}
      {composerState.open && (
        <PostComposerModal
          project={activeProject}
          assets={projectAssets}
          branding={workspace.branding}
          initialPost={composerState.post}
          prefillDateIso={composerState.prefillDateIso}
          prefillDraft={composerState.prefillDraft}
          onClose={() => setComposerState({ open: false })}
          onSavePost={handleSavePost}
          onDeletePost={handleDeletePost}
          onAiGenerateCopy={handleAiGenerateCopy}
          onAiGenerateHashtags={handleAiGenerateHashtags}
        />
      )}
    </div>
  );
}
