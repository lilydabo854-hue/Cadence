import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { workspaceStore } from './server/store.ts';
import {
  analyzeCompetitors,
  forecastPostPerformance,
  generateAiInsights,
  generateContentIdeas,
  generateHashtagSuggestions,
  generatePostCopy,
  generateStrategyPillar,
  runBrandAudit,
} from './server/ai.ts';
import { autoScheduleQueue } from './src/utils/scheduler.ts';
import { validateBrandAuditInput } from './src/utils/intelligence.ts';
import type {
  ApprovalComment,
  AutoScheduleRule,
  BrandAuditInput,
  BrandingConfig,
  ContentAsset,
  ContentFormat,
  PlatformId,
  PostStatus,
  Project,
  SocialPost,
} from './src/types/workspace.ts';

const PORT =
  process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT
    ? Number(process.env.DEFAULT_APP_PORT) || 3000
    : Number(process.env.PORT) || Number(process.env.DEFAULT_APP_PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Get complete workspace state
  app.get('/api/workspace', (_req, res) => {
    res.json(workspaceStore.getState());
  });

  // Switch active project
  app.put('/api/workspace/active-project', (req, res) => {
    const { projectId } = req.body as { projectId?: string };
    const state = workspaceStore.getState();
    if (!projectId || !state.projects.some((p) => p.id === projectId)) {
      res.status(400).json({ error: 'Invalid projectId' });
      return;
    }
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      activeProjectId: projectId,
    }));
    res.json(updated);
  });

  // Create new project
  app.post('/api/projects', (req, res) => {
    const { name, industry, handle, summary } = req.body as Partial<Project>;
    if (!name?.trim() || !industry?.trim()) {
      res.status(400).json({ error: 'Project name and industry are required.' });
      return;
    }
    const id = `proj-${Date.now()}`;
    const sourceSeries = workspaceStore.getState().projects[0]?.analyticsSeries ?? [];
    const newProject: Project = {
      id,
      name: name.trim(),
      industry: industry.trim(),
      handle: handle?.trim() || `@${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      summary: summary?.trim() || 'Cross-platform social strategy and content calendar.',
      connectedPlatforms: ['linkedin', 'instagram', 'facebook', 'x', 'youtube', 'pinterest', 'tiktok'],
      followersTotal: 1200,
      followerGrowth30dPct: 8.4,
      autoScheduleEnabled: true,
      autoScheduleRules: [
        { platform: 'linkedin', enabled: true, preferredHours: [9, 12, 16], weeklyTarget: 3 },
        { platform: 'instagram', enabled: true, preferredHours: [11, 14, 19], weeklyTarget: 4 },
        { platform: 'facebook', enabled: true, preferredHours: [10, 13], weeklyTarget: 3 },
        { platform: 'x', enabled: true, preferredHours: [8, 12, 17], weeklyTarget: 5 },
        { platform: 'youtube', enabled: true, preferredHours: [14, 17], weeklyTarget: 1 },
        { platform: 'pinterest', enabled: true, preferredHours: [15, 20], weeklyTarget: 3 },
        { platform: 'tiktok', enabled: true, preferredHours: [12, 18, 21], weeklyTarget: 4 },
      ],
      pillars: [
        {
          id: `pil-${Date.now()}`,
          projectId: id,
          name: 'Brand Foundations',
          description: 'Core storytelling, product education, and customer highlights.',
          targetSharePct: 50,
          tone: 'Clear, engaging',
          audience: 'Primary brand followers',
        },
      ],
      analyticsSeries: sourceSeries.map((pt) => ({
        ...pt,
        followers: Math.round(pt.followers * 0.08),
        reach: Math.round(pt.reach * 0.15),
        impressions: Math.round(pt.impressions * 0.15),
        engagements: Math.round(pt.engagements * 0.15),
      })),
      insights: [],
    };

    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      activeProjectId: id,
      projects: [...prev.projects, newProject],
    }));
    res.status(201).json(updated);
  });

  // Update project connected platforms
  app.put('/api/projects/:id/platforms', (req, res) => {
    const { id } = req.params;
    const { connectedPlatforms } = req.body as { connectedPlatforms?: PlatformId[] };
    if (!Array.isArray(connectedPlatforms)) {
      res.status(400).json({ error: 'connectedPlatforms array is required' });
      return;
    }
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, connectedPlatforms } : p
      ),
    }));
    res.json(updated);
  });

  // Add content pillar
  app.post('/api/projects/:id/pillars', (req, res) => {
    const { id } = req.params;
    const { name, description, targetSharePct, tone, audience } = req.body as {
      name?: string;
      description?: string;
      targetSharePct?: number;
      tone?: string;
      audience?: string;
    };
    if (!name?.trim() || !description?.trim()) {
      res.status(400).json({ error: 'Pillar name and description are required.' });
      return;
    }
    const pillarId = `pil-${Date.now()}`;
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              pillars: [
                ...p.pillars,
                {
                  id: pillarId,
                  projectId: id,
                  name: name.trim(),
                  description: description.trim(),
                  targetSharePct: Number(targetSharePct) || 25,
                  tone: tone?.trim() || 'Editorial',
                  audience: audience?.trim() || 'Core audience',
                },
              ],
            }
          : p
      ),
    }));
    res.status(201).json(updated);
  });

  // Create post
  app.post('/api/posts', (req, res) => {
    const body = req.body as Partial<SocialPost>;
    if (!body.projectId || !body.title?.trim() || !body.caption?.trim() || !body.platforms?.length) {
      res.status(400).json({ error: 'projectId, title, caption, and at least one platform are required.' });
      return;
    }
    const status: PostStatus = body.status ?? 'Draft';
    const initialComments: ApprovalComment[] =
      status === 'In Review'
        ? [
            {
              id: `c-${Date.now()}`,
              authorName: body.assignee || 'Elena Vance',
              authorRole: 'Social Strategist',
              body: 'Submitted post for team review.',
              createdAt: new Date().toISOString(),
              action: 'submitted',
            },
          ]
        : [];

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      projectId: body.projectId,
      title: body.title.trim(),
      caption: body.caption.trim(),
      hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
      platforms: body.platforms,
      format: body.format ?? 'Single Post',
      pillarId: body.pillarId ?? '',
      status,
      scheduledAt: body.scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      assetId: body.assetId,
      mediaKey: body.mediaKey,
      autoScheduled: Boolean(body.autoScheduled),
      assignee: body.assignee || 'Elena Vance',
      comments: initialComments,
    };

    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: [newPost, ...prev.posts],
    }));
    res.status(201).json({ state: updated, post: newPost });
  });

  // Update post
  app.put('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const patch = req.body as Partial<SocialPost>;
    const exists = workspaceStore.getState().posts.some((p) => p.id === id);
    if (!exists) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === id ? { ...p, ...patch, id } : p)),
    }));
    res.json(updated);
  });

  // Delete post
  app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== id),
    }));
    res.json(updated);
  });

  // Add comment to post approval thread
  app.post('/api/posts/:id/comments', (req, res) => {
    const { id } = req.params;
    const { authorName, authorRole, body, action } = req.body as Partial<ApprovalComment>;
    if (!body?.trim()) {
      res.status(400).json({ error: 'Comment body cannot be empty.' });
      return;
    }
    const comment: ApprovalComment = {
      id: `c-${Date.now()}`,
      authorName: authorName?.trim() || 'Maya Lin',
      authorRole: authorRole?.trim() || 'Brand Lead',
      body: body.trim(),
      createdAt: new Date().toISOString(),
      action: action ?? 'comment',
    };
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === id ? { ...p, comments: [...p.comments, comment] } : p
      ),
    }));
    res.status(201).json(updated);
  });

  // Approval workflow status transition
  app.post('/api/posts/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, commentBody, authorName, authorRole } = req.body as {
      status: PostStatus;
      commentBody?: string;
      authorName?: string;
      authorRole?: string;
    };
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }
    const actionMap: Record<string, ApprovalComment['action']> = {
      Approved: 'approved',
      Scheduled: 'approved',
      'Changes Requested': 'changes_requested',
      'In Review': 'submitted',
    };
    const newComment: ApprovalComment | null = commentBody?.trim()
      ? {
          id: `c-${Date.now()}`,
          authorName: authorName || 'Maya Lin',
          authorRole: authorRole || 'Brand Lead',
          body: commentBody.trim(),
          createdAt: new Date().toISOString(),
          action: actionMap[status] ?? 'comment',
        }
      : null;

    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              publishedAt: status === 'Published' ? new Date().toISOString() : p.publishedAt,
              comments: newComment ? [...p.comments, newComment] : p.comments,
            }
          : p
      ),
    }));
    res.json(updated);
  });

  // Automated scheduling across all channels for a project
  app.post('/api/schedule/auto-fill', (req, res) => {
    const { projectId, includeDrafts } = req.body as {
      projectId?: string;
      includeDrafts?: boolean;
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    const projectPosts = state.posts.filter((p) => p.projectId === project.id);
    const otherPosts = state.posts.filter((p) => p.projectId !== project.id);
    const targetStatuses: PostStatus[] = includeDrafts ? ['Approved', 'Draft'] : ['Approved'];

    const outcome = autoScheduleQueue(
      projectPosts,
      project.autoScheduleRules,
      new Date().toISOString(),
      targetStatuses
    );

    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      posts: [...outcome.updatedPosts, ...otherPosts],
    }));

    res.json({
      state: updated,
      scheduledCount: outcome.scheduledCount,
      slotAssignments: outcome.slotAssignments,
    });
  });

  // Update project auto-schedule rules
  app.put('/api/projects/:id/schedule-rules', (req, res) => {
    const { id } = req.params;
    const { autoScheduleEnabled, rules } = req.body as {
      autoScheduleEnabled?: boolean;
      rules?: AutoScheduleRule[];
    };
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id
          ? {
              ...p,
              autoScheduleEnabled:
                typeof autoScheduleEnabled === 'boolean' ? autoScheduleEnabled : p.autoScheduleEnabled,
              autoScheduleRules: Array.isArray(rules) ? rules : p.autoScheduleRules,
            }
          : p
      ),
    }));
    res.json(updated);
  });

  // Content Bank: add asset
  app.post('/api/assets', (req, res) => {
    const body = req.body as Partial<ContentAsset>;
    if (!body.projectId || !body.title?.trim()) {
      res.status(400).json({ error: 'projectId and asset title are required.' });
      return;
    }
    const asset: ContentAsset = {
      id: `ast-${Date.now()}`,
      projectId: body.projectId,
      title: body.title.trim(),
      type: body.type ?? 'image',
      source: body.source ?? 'upload',
      mediaKey: body.mediaKey || 'asset_skincare_serum',
      dimensions: body.dimensions || '1080 × 1350 px',
      platforms: body.platforms?.length ? body.platforms : ['instagram', 'linkedin'],
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdAt: new Date().toISOString(),
      canvaDesignId: body.canvaDesignId,
    };
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      assets: [asset, ...prev.assets],
    }));
    res.status(201).json({ state: updated, asset });
  });

  // Content Bank: delete asset
  app.delete('/api/assets/:id', (req, res) => {
    const { id } = req.params;
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
    }));
    res.json(updated);
  });

  // Canva Connect OAuth endpoints (follows iframe popup + postMessage rules)
  app.get('/api/canva/auth-url', (req, res) => {
    const baseUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
    const redirectUri = `${baseUrl}/auth/canva/callback`;
    const clientId = process.env.CANVA_CLIENT_ID;

    if (!clientId) {
      res.json({
        oauthConfigured: false,
        redirectUri,
        url: null,
      });
      return;
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'design:content:read design:meta:read asset:read brandtemplate:meta:read',
    });

    res.json({
      oauthConfigured: true,
      redirectUri,
      url: `https://www.canva.com/api/oauth/authorize?${params.toString()}`,
    });
  });

  app.get(['/auth/canva/callback', '/auth/canva/callback/'], (_req, res) => {
    workspaceStore.updateState((prev) => ({
      ...prev,
      canva: {
        ...prev.canva,
        connected: true,
        accountEmail: 'team@cadence-studio.design',
        lastSyncedAt: new Date().toISOString(),
      },
    }));

    res.send(`<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; padding: 24px;">
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'CANVA_OAUTH_SUCCESS' }, '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    </script>
    <p>Canva account connected. This window will close automatically.</p>
  </body>
</html>`);
  });

  // Sync / toggle Canva workspace library connection
  app.post('/api/canva/connect', (req, res) => {
    const { email, connected } = req.body as { email?: string; connected?: boolean };
    const isConnected = typeof connected === 'boolean' ? connected : true;
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      canva: {
        ...prev.canva,
        connected: isConnected,
        accountEmail: isConnected ? email?.trim() || 'studio@canva-workspace.com' : undefined,
        lastSyncedAt: isConnected ? new Date().toISOString() : undefined,
      },
    }));
    res.json(updated);
  });

  // Import a Canva design into a project's Content Bank
  app.post('/api/canva/import', (req, res) => {
    const { projectId, designId } = req.body as { projectId?: string; designId?: string };
    const state = workspaceStore.getState();
    const design = state.canva.designs.find((d) => d.id === designId);
    if (!projectId || !design) {
      res.status(400).json({ error: 'Valid projectId and designId are required.' });
      return;
    }

    const asset: ContentAsset = {
      id: `ast-canva-${Date.now()}`,
      projectId,
      title: design.title,
      type: 'template',
      source: 'canva',
      mediaKey: design.mediaKey,
      dimensions: design.dimensions,
      platforms: design.suggestedPlatforms,
      tags: ['canva', design.category.toLowerCase().replace(/\s+/g, '-')],
      createdAt: new Date().toISOString(),
      canvaDesignId: design.id,
    };

    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      canva: {
        ...prev.canva,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
      },
      assets: [asset, ...prev.assets],
    }));

    res.status(201).json({ state: updated, asset });
  });

  // Update customizable team branding & UI settings
  app.put('/api/branding', (req, res) => {
    const patch = req.body as Partial<BrandingConfig>;
    const updated = workspaceStore.updateState((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        ...patch,
      },
    }));
    res.json(updated);
  });

  // Server-side Gemini AI endpoints
  app.post('/api/ai/insights', async (req, res) => {
    const { projectId } = req.body as { projectId?: string };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    try {
      const projectPosts = state.posts.filter((p) => p.projectId === project.id);
      const insights = await generateAiInsights(project, projectPosts);
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, insights } : p
        ),
      }));
      res.json({ insights, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate AI insights.';
      console.error('AI insights error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/generate-copy', async (req, res) => {
    const { projectId, platforms, topic, tone, pillarId } = req.body as {
      projectId?: string;
      platforms?: PlatformId[];
      topic?: string;
      tone?: string;
      pillarId?: string;
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !topic?.trim()) {
      res.status(400).json({ error: 'Valid project and topic are required.' });
      return;
    }

    try {
      const pillar = project.pillars.find((pil) => pil.id === pillarId);
      const copy = await generatePostCopy(
        project,
        platforms?.length ? platforms : ['linkedin', 'instagram'],
        topic.trim(),
        tone || pillar?.tone || 'Editorial, clear',
        pillar?.name
      );
      res.json(copy);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate post copy.';
      console.error('AI copy generation error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/hashtags', async (req, res) => {
    const { projectId, platforms, topic, caption, format } = req.body as {
      projectId?: string;
      platforms?: PlatformId[];
      topic?: string;
      caption?: string;
      format?: ContentFormat;
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project) {
      res.status(404).json({ error: 'Active project not found.' });
      return;
    }
    if (!topic?.trim() && !caption?.trim()) {
      res.status(400).json({ error: 'Enter a caption or post title first to generate hashtags.' });
      return;
    }

    try {
      const result = await generateHashtagSuggestions(project, {
        platforms: platforms?.length ? platforms : ['instagram'],
        topic: topic?.trim() || '',
        caption: caption?.trim() || '',
        format,
      });
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate hashtags.';
      console.error('AI hashtag generation error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/strategy', async (req, res) => {
    const { projectId, goal } = req.body as { projectId?: string; goal?: string };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !goal?.trim()) {
      res.status(400).json({ error: 'Valid project and goal are required.' });
      return;
    }

    try {
      const suggestion = await generateStrategyPillar(project, goal.trim());
      const newPillar = {
        id: `pil-${Date.now()}`,
        projectId: project.id,
        ...suggestion,
      };
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, pillars: [...p.pillars, newPillar] } : p
        ),
      }));
      res.status(201).json({ pillar: newPillar, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate strategy pillar.';
      console.error('AI strategy error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/competitor-analysis', async (req, res) => {
    const { projectId, urls } = req.body as { projectId?: string; urls?: string[] };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({ error: 'Valid project and at least one competitor profile URL are required.' });
      return;
    }

    try {
      const report = await analyzeCompetitors(project, urls);
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id
            ? { ...p, competitorReports: [report, ...(p.competitorReports ?? [])] }
            : p
        ),
      }));
      res.status(201).json({ report, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Competitor analysis failed.';
      console.error('Competitor analysis error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/content-ideas', async (req, res) => {
    const { projectId, industry, audienceInterests, platforms } = req.body as {
      projectId?: string;
      industry?: string;
      audienceInterests?: string;
      platforms?: PlatformId[];
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !industry?.trim()) {
      res.status(400).json({ error: 'Valid project and industry/niche are required.' });
      return;
    }

    try {
      const batch = await generateContentIdeas(
        project,
        industry.trim(),
        audienceInterests?.trim() || '',
        platforms?.length ? platforms : ['instagram', 'tiktok', 'linkedin']
      );
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id
            ? { ...p, ideaBatches: [batch, ...(p.ideaBatches ?? [])] }
            : p
        ),
      }));
      res.status(201).json({ batch, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Content idea generation failed.';
      console.error('Content ideas error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/forecast', async (req, res) => {
    const { projectId, platform, format, contentDescription } = req.body as {
      projectId?: string;
      platform?: PlatformId;
      format?: ContentFormat;
      contentDescription?: string;
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !platform || !format || !contentDescription?.trim()) {
      res.status(400).json({
        error: 'Project, target platform, content format, and content description are required.',
      });
      return;
    }

    try {
      const projectPosts = state.posts.filter((p) => p.projectId === project.id);
      const forecast = await forecastPostPerformance(project, projectPosts, {
        platform,
        format,
        contentDescription: contentDescription.trim(),
      });
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id
            ? { ...p, forecasts: [forecast, ...(p.forecasts ?? [])] }
            : p
        ),
      }));
      res.status(201).json({ forecast, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Performance forecasting failed.';
      console.error('Forecast error:', message);
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/brand-audit', async (req, res) => {
    const { projectId, input } = req.body as {
      projectId?: string;
      input?: BrandAuditInput;
    };
    const state = workspaceStore.getState();
    const project = state.projects.find((p) => p.id === (projectId || state.activeProjectId));
    if (!project || !input) {
      res.status(400).json({ error: 'Project and brand audit metrics are required.' });
      return;
    }

    const validation = validateBrandAuditInput(input);
    if (!validation.valid) {
      res.status(400).json({ error: validation.errors[0] });
      return;
    }

    try {
      const audit = await runBrandAudit(input);
      const updated = workspaceStore.updateState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id
            ? { ...p, brandAudits: [audit, ...(p.brandAudits ?? [])] }
            : p
        ),
      }));
      res.status(201).json({ audit, state: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Brand audit failed.';
      console.error('Brand audit error:', message);
      res.status(502).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);
  const hmrDisabled = process.env.DISABLE_HMR === 'true';

  // Mount Vite middleware in development (non-blocking port bind), static dist in production
  if (process.env.NODE_ENV !== 'production') {
    let viteInstance: Awaited<ReturnType<typeof createViteServer>> | null = null;
    const vitePromise = createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        watch: hmrDisabled ? null : {},
      },
      appType: 'spa',
    }).then((vite) => {
      viteInstance = vite;
      return vite;
    });
    vitePromise.catch((err) => {
      console.error('Vite middleware initialization failed:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = viteInstance ?? (await vitePromise);
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.on('error', (err) => {
    console.error(`Server failed to listen on 0.0.0.0:${PORT}:`, err);
    process.exit(1);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadence server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
